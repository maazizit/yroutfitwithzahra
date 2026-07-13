// Supabase Edge Function — tag-morphology
// Reçoit la description (et/ou l'image base64) d'un vêtement,
// interroge Gemini 2.0 Flash et renvoie un JSON pur : { tags, category, confidence }.
//
// Déploiement :
//   supabase functions deploy tag-morphology
//   supabase secrets set GEMINI_API_KEY=<ta_clé_AI_Studio>
//
// Debug : passer { "debug": true } dans le body pour recevoir en plus le
// texte brut renvoyé par Gemini (utile pour valider un échantillon avant
// de scaler — voir scripts/audit-tags.js).

const ALLOWED_TAGS = ['sablier', 'poire', 'pomme', 'rectangle', 'triangle_inverse'] as const;
const ALL_TAGS = [...ALLOWED_TAGS];

const SYSTEM_PROMPT = `Tu es styliste mode spécialisée en morphologie féminine. On te donne la description
et/ou la photo d'un vêtement. Ta seule sortie est un objet JSON strict, sans markdown, sans texte
autour, avec exactement ces clés : {"tags": [...], "category": "...", "confidence": 0.0}

## Les 5 morphologies — critères concrets (pas de généralités)

- "sablier" (épaules ≈ hanches, taille marquée) : favorisé par tout ce qui SOULIGNE la taille —
  cintré, portefeuille, ceinturé, bodycon, taille marquée. Défavorisé par les coupes droites/amples
  sans marquage de taille (ça cache l'atout principal).
- "poire" (hanches > épaules) : favorisé par le VOLUME EN HAUT (épaules structurées, manches
  ballon/bouffantes, col bateau, épaulettes) et les bas fluides/évasés à partir de la taille
  (trapèze, A-line, palazzo) qui glissent sur les hanches sans ajouter de volume. Défavorisé par les
  hauts moulants sans structure et les jupes crayon serrées sur les hanches.
- "pomme" (buste/ventre plus généreux, taille peu marquée) : favorisé par les coupes qui NE
  SERRENT PAS la taille — empire, fluide, drapé, col en V profond (allonge le buste), matières
  fluides. Défavorisé par tout ce qui est moulant/ceinturé à la taille naturelle.
- "rectangle" (silhouette droite, peu de courbes) : favorisé par ce qui CRÉE des courbes —
  péplum, volants, ceinture marquée, superpositions, volume asymétrique. Défavorisé par les coupes
  très droites sans aucun détail structurant (ça accentue le côté "planche").
- "triangle_inverse" (épaules > hanches) : favorisé par le VOLUME EN BAS (jupe/pantalon évasé,
  palazzo, wide leg) et les hauts SANS structure d'épaule (col V, épaules nues, sans épaulettes).
  Défavorisé par tout ce qui ajoute du volume aux épaules (épaulettes, manches structurées, col
  bateau, blazer à épaules marquées) — même si ce même vêtement est excellent pour "poire".

## Règles de sortie

1. "tags" : 1 à 3 morphologies MAXIMUM parmi la liste ci-dessus — seulement celles pour
   lesquelles le vêtement est un choix clairement recommandé par un guide de style. N'invente
   rien : si le vêtement a un effet négatif documenté sur une morphologie (ex. col bateau et
   triangle_inverse), NE PAS l'inclure.
2. Vêtement universel ou neutre (t-shirt basique, jean droit sans détail, pull uni, chaussures,
   la plupart des bijoux) : renvoie les 5 tags — ["sablier","poire","pomme","rectangle","triangle_inverse"] —
   plutôt que d'en choisir 1-3 arbitrairement. Ne présente jamais un vêtement neutre comme un choix
   "spécialement recommandé" pour seulement 2 morphologies par défaut.
3. Accessoire sans lien structurel avec la silhouette (boucles d'oreilles, collier, lunettes,
   petit sac à main) : renvoie tags: [] et confidence: 0.2 — ne force pas une réponse.
4. "category" : une seule valeur parmi "Robes", "Hauts", "Bas", "Vestes", "Accessoires".
5. "confidence" : 0 à 1, réflète ta certitude réelle sur le jugement morphologique (pas sur la
   catégorie). Un vêtement décrit en une phrase vague → confidence basse (~0.3-0.5). Une
   description détaillée avec coupe/matière précises → confidence haute (~0.8-0.95).
6. Aucune autre clé. Aucun commentaire. Aucun QCM. JSON pur uniquement.

## Exemples (few-shot)

Vêtement : Blazer oversize épaules structurées, coupe droite
→ {"tags":["poire","rectangle","pomme"],"category":"Vestes","confidence":0.85}

Vêtement : Haut col bateau structuré, manches courtes
→ {"tags":["poire"],"category":"Hauts","confidence":0.75}

Vêtement : Robe empire manches ballon, tissu fluide
→ {"tags":["pomme"],"category":"Robes","confidence":0.85}

Vêtement : T-shirt basique coton, coupe droite
→ {"tags":["sablier","poire","pomme","rectangle","triangle_inverse"],"category":"Hauts","confidence":0.6}

Vêtement : Boucles d'oreilles créoles dorées
→ {"tags":[],"category":"Accessoires","confidence":0.2}`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

interface RequestBody {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
  debug?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Méthode non autorisée' }, 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return json({ error: 'GEMINI_API_KEY non configurée côté serveur' }, 500);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }

  const parts: Array<Record<string, unknown>> = [];
  if (body.description && body.description.trim().length > 0) {
    parts.push({ text: `Vêtement : ${body.description.trim().slice(0, 2000)}` });
  }
  if (body.imageBase64) {
    parts.push({
      inline_data: {
        mime_type: body.mimeType ?? 'image/jpeg',
        data: body.imageBase64,
      },
    });
  }
  if (parts.length === 0) {
    return json({ error: 'Fournis "description" et/ou "imageBase64"' }, 400);
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              tags: {
                type: 'ARRAY',
                items: { type: 'STRING', enum: ALL_TAGS },
              },
              category: {
                type: 'STRING',
                enum: ['Robes', 'Hauts', 'Bas', 'Vestes', 'Accessoires'],
              },
              confidence: { type: 'NUMBER' },
            },
            required: ['tags', 'category', 'confidence'],
          },
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    return json({ error: 'Gemini indisponible', detail: detail.slice(0, 300) }, 502);
  }

  const payload = await geminiResponse.json();
  const text: string | undefined = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return json({ error: 'Réponse Gemini vide' }, 502);
  }

  let parsed: { tags?: unknown; category?: unknown; confidence?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    return json({ error: 'Réponse Gemini non-JSON', raw: text.slice(0, 300) }, 502);
  }

  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string =>
        (ALLOWED_TAGS as readonly string[]).includes(String(t)),
      )
    : [];
  const category = typeof parsed.category === 'string' ? parsed.category : 'Inconnu';
  const confidenceRaw = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
  const confidence = Math.min(1, Math.max(0, confidenceRaw));

  return json({
    tags,
    category,
    confidence,
    ...(body.debug ? { debugRawText: text } : {}),
  });
});
