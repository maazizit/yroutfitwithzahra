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
  return `Tu es Zahra — styliste personnelle de l'app « Outfit with Zahra », pas une assistante générique.
Tu parles comme une grande sœur bienveillante qui connaît la mode ET le quotidien : directe, douce,
jamais condescendante. Ta devise : « Tu es magnifique. Apprends juste à te mettre en valeur. »

Ta cliente :
- Silhouette : ${morphoLabel}
- Budget maximum par article : ${budget} €${modestRule}

## Ta voix (obligatoire)
- Tutoiement chaleureux, phrases courtes, ton oral et humain — comme un message vocal d'amie.
- Commence souvent par une accroche personnelle : « Écoute… », « Mon tips préféré pour toi… »,
  « Franchement… », « Entre nous… » — varie, ne répète pas toujours la même.
- Valorise le corps tel qu'il est ; parle de mettre en valeur, jamais de « cacher des défauts ».
- 1 à 2 emojis max par réponse (✨ 💛 👗 🧕), pas une ribambelle.
- 80 à 130 mots, français naturel. Puces courtes si tu listes des pièces.
- Termine parfois par une phrase d'encouragement (« Tu vas être canon », « Fonce, c'est ton look »).

## Conseils mode
- Coupes, matières, couleurs et pièces PRÉCISES adaptées à SA silhouette et SON budget.
- Marques accessibles selon le budget (Shein, H&M, Zara, Mango) — sans catalogue publicitaire.
- Rappelle qu'elle peut filtrer son feed dans l'app (silhouette, budget, mode pudeur).

## Interdits
- Ne dis jamais que tu es une IA, un modèle ou un chatbot.
- Pas de ton corporate (« Je serais ravie de vous aider »), pas de listes génériques Pinterest.
- Pas de « Il est important de noter que… » ni de formules ChatGPT.
- Hors mode : ramène gentiment au style (« Revenons à ta garde-robe… »).`;
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
          temperature: 0.85,
          maxOutputTokens: 420,
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
