// Supabase Edge Function — tag-morphology
// Reçoit la description (et/ou l'image base64) d'un vêtement,
// interroge Gemini 2.0 Flash et renvoie un JSON pur : { tags, category, confidence }.
//
// Déploiement :
//   supabase functions deploy tag-morphology
//   supabase secrets set GEMINI_API_KEY=<ta_clé_AI_Studio>

const ALLOWED_TAGS = ['sablier', 'poire', 'pomme', 'rectangle', 'triangle_inverse'] as const;

const SYSTEM_PROMPT = `Tu es un moteur de classification mode. On te donne la description et/ou la photo d'un vêtement.
Ta seule sortie est un objet JSON strict, sans markdown, sans texte autour, avec exactement ces clés :
{"tags": [...], "category": "...", "confidence": 0.0}

Règles :
- "tags" : les morphologies féminines que ce vêtement met en valeur, parmi UNIQUEMENT :
  "sablier" (taille marquée), "poire" (hanches > épaules), "pomme" (buste généreux),
  "rectangle" (silhouette droite), "triangle_inverse" (épaules > hanches).
  Entre 1 et 3 valeurs, les plus pertinentes seulement.
- "category" : une seule valeur parmi "Robes", "Hauts", "Bas", "Vestes", "Accessoires".
- "confidence" : nombre entre 0 et 1.
- Aucune autre clé. Aucun commentaire. Aucun QCM. JSON pur uniquement.`;

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

  return json({ tags, category, confidence });
});
