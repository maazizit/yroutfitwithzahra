// Supabase Edge Function — ask-zahra
// Chatbot styliste : reçoit { message, morphology, budget } et répond avec la
// personnalité de Zahra via Gemini 2.0 Flash. Renvoie { reply }.
//
// Déploiement :
//   supabase functions deploy ask-zahra
//   supabase secrets set GEMINI_API_KEY=<ta_clé_AI_Studio>

const MORPHO_LABELS: Record<string, string> = {
  sablier: 'Sablier (épaules et hanches alignées, taille marquée)',
  poire: 'Poire (hanches plus larges que les épaules)',
  pomme: 'Pomme (buste généreux, jambes fines)',
  rectangle: 'Rectangle (silhouette longiligne, taille peu marquée)',
  triangle_inverse: 'Triangle inversé (épaules plus larges que les hanches)',
};

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

function systemPrompt(morphology: string, budget: number, modestMode: boolean): string {
  const morphoLabel = MORPHO_LABELS[morphology] ?? morphology;
  const modestRule = modestMode
    ? `
- IMPORTANT — Mode Pudeur activé : ta cliente porte le hijab et suit les standards vestimentaires islamiques (char3i).
  TOUS tes conseils doivent proposer des tenues couvrantes : manches longues, longueurs maxi ou amples,
  tissus opaques, pas de décolleté ni de pièces moulantes. Suggère hijabs, abayas modernes, robes longues,
  tuniques, superpositions élégantes. Le style pudique est moderne et magnifique — valorise-le toujours.`
    : '';
  return `Tu es Zahra, styliste personnelle chaleureuse et bienveillante de l'application "Outfit with Zahra".
Ta devise : "Tu es magnifique. Apprends juste à te mettre en valeur."

Ta cliente :
- Silhouette : ${morphoLabel}
- Budget maximum par article : ${budget} €${modestRule}

Règles :
- Tutoie, sois chaleureuse, positive et body-positive — jamais de remarque négative sur le corps.
- Réponds en français, 80 à 140 mots maximum, avec quelques emojis légers (✨💛👗) et des puces si utile.
- Donne des conseils mode CONCRETS adaptés à SA silhouette et SON budget (coupes, couleurs, matières, pièces précises).
- Suggère des marques accessibles (Shein, H&M, Zara, Mango) selon le budget.
- Si la question n'est pas liée à la mode, ramène gentiment la conversation au style.
- Ne mentionne jamais que tu es une IA ou un modèle de langage : tu es Zahra.`;
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

  let body: { message?: string; morphology?: string; budget?: number; modestMode?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }

  const message = (body.message ?? '').trim().slice(0, 1000);
  if (!message) {
    return json({ error: 'Champ "message" requis' }, 400);
  }
  const morphology = body.morphology ?? 'sablier';
  const budget = typeof body.budget === 'number' && body.budget > 0 ? body.budget : 30;
  const modestMode = body.modestMode === true;

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(morphology, budget, modestMode) }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 400,
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    return json({ error: 'Gemini indisponible', detail: detail.slice(0, 300) }, 502);
  }

  const payload = await geminiResponse.json();
  const reply: string | undefined = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    return json({ error: 'Réponse Gemini vide' }, 502);
  }

  return json({ reply: reply.trim() });
});
