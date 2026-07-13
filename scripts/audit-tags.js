/**
 * Audit manuel du tagging morphologique — appelle la fonction Supabase
 * `tag-morphology` (Gemini) sur un échantillon de vêtements tests et
 * affiche un tableau pour validation avant de scaler sur tout le catalogue.
 *
 * Usage :
 *   node scripts/audit-tags.js                 → échantillon intégré (13 cas)
 *   node scripts/audit-tags.js --file mes.json  → ton propre échantillon
 *                                                  (JSON: [{ "description": "..." }, ...])
 *
 * Prérequis dans .env : EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY
 * (la fonction doit être déployée : `supabase functions deploy tag-morphology`
 * avec le secret GEMINI_API_KEY configuré).
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

/**
 * Échantillon de validation — 13 descriptions couvrant les cas qui ont fait
 * échouer l'ancienne heuristique par mots-clés (voir audit) : signaux de
 * structure d'épaule, coupes neutres, accessoires, robes sans marquage de
 * taille. `expected` = avis d'un guide de style standard, pour comparaison
 * visuelle rapide — ce n'est pas une vérité absolue à valider automatiquement.
 */
const SAMPLE = [
  {
    description: 'Robe portefeuille cintrée à la taille, tissu satiné, manches 3/4',
    expected: 'sablier',
  },
  {
    description: 'Jean taille haute coupe droite, denim brut',
    expected: 'universel (sablier, rectangle en priorité)',
  },
  {
    description: 'Blazer oversize épaules structurées, coupe droite',
    expected: 'poire, rectangle, pomme — PAS triangle_inverse',
  },
  {
    description: 'Jupe trapèze taille haute, coupe évasée',
    expected: 'poire, triangle_inverse, rectangle',
  },
  {
    description: 'Haut col bateau structuré, manches courtes',
    expected: 'poire — mauvais pour triangle_inverse',
  },
  {
    description: 'Robe empire manches ballon, tissu fluide',
    expected: 'pomme',
  },
  {
    description: 'Pantalon palazzo taille haute, jambe très large',
    expected: 'triangle_inverse, poire',
  },
  {
    description: 'Top crop côtelé moulant, dos nu',
    expected: 'sablier',
  },
  {
    description: 'Robe bustier sans bretelles, jupon plissé mi-longueur',
    expected: 'sablier, poire, rectangle',
  },
  {
    description: 'Gilet long sans manches, maille côtelée, coupe droite',
    expected: 'pomme, rectangle',
  },
  {
    description: 'Ceinture fine dorée',
    expected: 'accessoire neutre — tags vides ou universels attendus',
  },
  {
    description: 'Blouse satinée fluide, col en V profond',
    expected: 'pomme (+ sablier, poire en secondaire)',
  },
  {
    description: 'Robe droite mi-longue, coupe crayon',
    expected: 'rectangle — pas vraiment sablier',
  },
];

async function callTagMorphology(baseUrl, key, description) {
  const response = await fetch(`${baseUrl}/functions/v1/tag-morphology`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify({ description, debug: true }),
  });
  const text = await response.text();
  if (!response.ok) {
    return { error: `HTTP ${response.status} — ${text.slice(0, 200)}` };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Réponse non-JSON : ${text.slice(0, 200)}` };
  }
}

async function main() {
  loadEnv();
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
  if (!baseUrl || !key) {
    console.error('EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY manquants dans .env');
    process.exit(1);
  }

  const fileArgIndex = process.argv.indexOf('--file');
  const sample =
    fileArgIndex !== -1
      ? JSON.parse(fs.readFileSync(process.argv[fileArgIndex + 1], 'utf8'))
      : SAMPLE;

  console.log(`Audit de ${sample.length} vêtement(s) via tag-morphology (Gemini)...\n`);

  const rows = [];
  for (const item of sample) {
    const result = await callTagMorphology(baseUrl, key, item.description);
    rows.push({ ...item, result });
    const label = result.error
      ? `ERREUR : ${result.error}`
      : `[${(result.tags ?? []).join(', ') || '—'}]  cat=${result.category}  conf=${result.confidence}`;
    console.log(`• ${item.description}`);
    if (item.expected) console.log(`  attendu : ${item.expected}`);
    console.log(`  Gemini  : ${label}\n`);
  }

  const outPath = path.join(__dirname, '..', 'audit-tags-result.json');
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
  console.log(`Résultat complet (avec debugRawText) sauvegardé dans ${outPath}`);
  console.log('Relis chaque ligne et compare avec la colonne "attendu" avant de lancer un import massif.');
}

main().catch((e) => {
  console.error('Échec audit :', e.message);
  process.exit(1);
});
