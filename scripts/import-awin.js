/**
 * Import catalogue Awin → table Supabase `products`.
 * Lit les variables depuis `.env` (ou process.env).
 *
 * Usage : node scripts/import-awin.js
 * Prérequis : AWIN_FEED_URL + SUPABASE_DB_PASSWORD dans .env
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const zlib = require('zlib');
const { promisify } = require('util');
const { Client } = require('pg');

const gunzip = promisify(zlib.gunzip);

function downloadFeed(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const opts = url.startsWith('https:') ? { rejectUnauthorized: false } : {};
    const req = lib.get(url, opts, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirectsLeft <= 0) return reject(new Error('Trop de redirections Awin'));
        const next = new URL(res.headers.location, url).href;
        return resolve(downloadFeed(next, redirectsLeft - 1));
      }
      if (res.statusCode >= 400) {
        return reject(new Error(`Flux Awin inaccessible (${res.statusCode})`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: res.headers['content-type'] ?? '',
      }));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

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

const ALLOWED_TAGS = ['sablier', 'poire', 'pomme', 'rectangle', 'triangle_inverse'];
const CATEGORY_MAP = [
  [/dress|robe/i, 'Robes'],
  [/top|shirt|blouse|tee|pull|sweat|chemis/i, 'Hauts'],
  [/pant|jean|skirt|jupe|trouser|short|legging/i, 'Bas'],
  [/jacket|coat|blazer|veste|manteau|gilet/i, 'Vestes'],
  [/belt|bag|scarf|ceinture|sac|bijou|accessor/i, 'Accessoires'],
];
const MODEST_PATTERN =
  /abaya|hijab|khimar|jilbab|kaftan|caftan|modest|maxi|longue|long sleeve|manches longues|tunic|tunique|palazzo|wide leg|oversized|oversize|loose|ample|cardigan long|kimono/i;
const NON_CLOTHING =
  /savon|soap|parfum|perfume|carte cadeau|gift\s*card|bougie|candle|cr[eè]me|cream|s[eé]rum|serum|shampo|maquillage|makeup|cosm[eé]t|lotion|dentifrice|d[eé]odorant/i;
const CLOTHING_HINT =
  /robe|dress|top|blouse|shirt|tee|pull|pantalon|pant|jean|jupe|skirt|short|legging|veste|jacket|coat|blazer|manteau|gilet|cardigan|abaya|hijab|tunique|combinaison|lingerie|soutien|bikini|maillot|chaussure|shoe|boot|sac\b|bag\b|ceinture|belt|écharpe|scarf|mode\b|fashion|wear|vêtement|vetement|habillement/i;

function isClothingProduct(name, merchantCategory) {
  const haystack = `${name} ${merchantCategory ?? ''}`.toLowerCase();
  if (NON_CLOTHING.test(haystack)) return false;
  return CLOTHING_HINT.test(haystack);
}
// Filet de secours utilisé seulement quand Gemini est indisponible/épuisé
// (voir tagWithGemini). Volontairement plus large que la V1 pour capturer
// les signaux d'épaule (poire/triangle_inverse) et les coupes neutres —
// voir l'audit du 2026-07 : l'ancien fallback ['sablier','rectangle'] par
// défaut sur-représentait ces deux morphologies dans tout le catalogue.
const SHOULDER_STRUCTURE = /épaulettes|epaulettes|structur|oversize|oversized|col bateau|carrure marquée|carrure marquee|manches? ballon|manches? bouffantes?/i;
const WAIST_DEFINED = /wrap|portefeuille|cintr|belted|ceintur|bodycon|moulant|taille marquée|taille marquee/i;
const BOTTOM_VOLUME = /a-line|évasé|evase|trapèze|trapeze|flare|wide leg|palazzo|large|jambe large/i;
const NO_WAIST_FLOW = /empire|fluide|flowy|v-neck|col v|drap|crayon|sheath|droit(e)?\b/i;
const CURVE_CREATING = /peplum|volant|ruffle|volume|cardigan long|gilet long|tunique/i;

const TAG_RULES = [
  // Signal fort de taille marquée → sablier
  [WAIST_DEFINED, ['sablier']],
  // Volume en bas (jupe/pantalon évasé) → poire + triangle_inverse
  [BOTTOM_VOLUME, ['poire', 'triangle_inverse']],
  // Structure d'épaule → bon pour poire/rectangle/pomme, PAS triangle_inverse
  [SHOULDER_STRUCTURE, ['poire', 'rectangle', 'pomme']],
  // Coupe fluide sans marquage de taille → pomme
  [NO_WAIST_FLOW, ['pomme', 'rectangle']],
  // Détails qui créent une courbe → rectangle
  [CURVE_CREATING, ['rectangle', 'pomme']],
];

/** Vêtement dont le nom ne contient aucun signal de coupe (t-shirt basique, jean uni…). */
function looksNeutral(text) {
  return !TAG_RULES.some(([pattern]) => pattern.test(text));
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else current += ch;
  }
  cells.push(current);
  return cells;
}

function inferCategory(text) {
  for (const [pattern, category] of CATEGORY_MAP) {
    if (pattern.test(text)) return category;
  }
  return 'Hauts';
}

/**
 * Tagging heuristique (filet de secours, pas la source principale — voir
 * tagWithGemini). Un article sans aucun signal de coupe reçoit les 5 tags
 * plutôt qu'un couple par défaut arbitraire : on ne prétend pas savoir ce
 * qu'on ne sait pas.
 */
function inferTags(text) {
  const tags = new Set();
  for (const [pattern, matched] of TAG_RULES) {
    if (pattern.test(text)) matched.forEach((t) => tags.add(t));
  }
  if (tags.size === 0) ALLOWED_TAGS.forEach((t) => tags.add(t));
  return [...tags].filter((t) => ALLOWED_TAGS.includes(t));
}

function inferGender(text) {
  const t = text.toLowerCase();
  if (/unisex|unisexe|mixte|gender\s*neutral/i.test(t)) return 'mixte';
  const homme =
    /homme|men'?s?\b|\bman\b|masculin|garçon|garcon|\bmale\b|for\s*him|pour\s*lui|boy'?s?\b/i.test(t);
  const femme =
    /femme|women|woman|ladies|\blady\b|féminin|feminin|\bfille\b|\bfemale\b|for\s*her|pour\s*elle|\brobe\b|\bdress\b|jupe|skirt|soutien|lingerie|\bbra\b/i.test(
      t,
    );
  if (homme && femme) return 'mixte';
  if (homme) return 'homme';
  if (femme) return 'femme';
  return 'mixte';
}

const SIZE_ALIASES = {
  SMALL: 'S', MEDIUM: 'M', LARGE: 'L', XLARGE: 'XL',
  T0: 'XS', T1: 'S', T2: 'M', T3: 'L', T4: 'XL', '3XL': 'XXL',
};

function normalizeSize(raw) {
  const s = raw.trim().toUpperCase();
  return SIZE_ALIASES[s] ?? s;
}

function parseSizesCell(raw) {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(/[,|/;]+/).map((part) => normalizeSize(part)).filter(Boolean))];
}

function inferSizesFromText(text) {
  const found = [];
  const re = /\b(XXS|XS|S|M|L|XL|XXL|3XL|T[0-4]|3[2-9]|4[0-8])\b/gi;
  let match;
  while ((match = re.exec(text)) !== null) found.push(normalizeSize(match[1]));
  return [...new Set(found)];
}

function findSizeColumn(header) {
  for (const name of ['fashion:size', 'size', 'fashion_size']) {
    const i = header.indexOf(name);
    if (i !== -1) return i;
  }
  return header.findIndex((h) => h.includes('size') && !h.includes('stock'));
}

function extractSizes(cells, sizeIdx, name, description) {
  const fromColumn = sizeIdx !== -1 ? parseSizesCell(cells[sizeIdx] ?? '') : [];
  if (fromColumn.length) return fromColumn;
  return inferSizesFromText(`${name} ${description ?? ''}`);
}

function findColourColumn(header) {
  for (const name of ['colour', 'color', 'fashion:colour']) {
    const i = header.indexOf(name);
    if (i !== -1) return i;
  }
  return header.findIndex((h) => h.includes('colour') || h === 'color');
}

function parseColoursCell(raw) {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(/[,|/;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean))];
}

function inferColoursFromText(text) {
  const lower = text.toLowerCase();
  const ids = [];
  const map = [
    ['noir', 'black'], ['blanc', 'white'], ['beige', 'beige'], ['rouge', 'red'],
    ['rose', 'pink'], ['bleu', 'blue'], ['vert', 'green'], ['violet', 'purple'], ['gris', 'grey', 'gray'],
  ];
  for (const keys of map) {
    if (keys.some((k) => lower.includes(k))) ids.push(keys[0]);
  }
  return [...new Set(ids)];
}

function extractColours(cells, colourIdx, name, description) {
  const fromColumn = colourIdx !== -1 ? parseColoursCell(cells[colourIdx] ?? '') : [];
  if (fromColumn.length) return fromColumn;
  return inferColoursFromText(`${name} ${description ?? ''}`);
}

// ⚠️ Garder ce prompt aligné avec supabase/functions/tag-morphology/index.ts
// (deux runtimes différents — Deno pour l'Edge Function, Node ici — donc
// pas de fichier partagé simple, d'où la duplication volontaire).
const GEMINI_SYSTEM_PROMPT = `Tu es styliste mode spécialisée en morphologie féminine. On te donne la description
d'un vêtement. Ta seule sortie est un objet JSON strict, sans markdown, sans texte
autour, avec exactement ces clés : {"tags": [...], "category": "...", "confidence": 0.0}

## Les 5 morphologies — critères concrets (pas de généralités)

- "sablier" (épaules ≈ hanches, taille marquée) : favorisé par tout ce qui SOULIGNE la taille —
  cintré, portefeuille, ceinturé, bodycon, taille marquée. Défavorisé par les coupes droites/amples
  sans marquage de taille.
- "poire" (hanches > épaules) : favorisé par le VOLUME EN HAUT (épaules structurées, manches
  ballon/bouffantes, col bateau, épaulettes) et les bas fluides/évasés à partir de la taille
  (trapèze, A-line, palazzo). Défavorisé par les hauts moulants sans structure et les jupes crayon
  serrées sur les hanches.
- "pomme" (buste/ventre plus généreux, taille peu marquée) : favorisé par les coupes qui NE
  SERRENT PAS la taille — empire, fluide, drapé, col en V profond, matières fluides. Défavorisé
  par tout ce qui est moulant/ceinturé à la taille naturelle.
- "rectangle" (silhouette droite, peu de courbes) : favorisé par ce qui CRÉE des courbes —
  péplum, volants, ceinture marquée, superpositions. Défavorisé par les coupes très droites sans
  aucun détail structurant.
- "triangle_inverse" (épaules > hanches) : favorisé par le VOLUME EN BAS (jupe/pantalon évasé,
  palazzo, wide leg) et les hauts SANS structure d'épaule. Défavorisé par tout ce qui ajoute du
  volume aux épaules (épaulettes, manches structurées, col bateau, blazer à épaules marquées) —
  même si ce même vêtement est excellent pour "poire".

## Règles de sortie

1. "tags" : 1 à 3 morphologies MAXIMUM — seulement celles clairement recommandées par un guide de
   style. N'inclus jamais une morphologie pour laquelle le vêtement a un effet négatif documenté.
2. Vêtement universel/neutre (t-shirt basique, jean droit sans détail, chaussures, bijoux
   basiques) : renvoie les 5 tags plutôt que d'en choisir 1-3 arbitrairement.
3. Accessoire sans lien structurel avec la silhouette (boucles d'oreilles, collier, petit sac) :
   renvoie tags: [] et confidence: 0.2.
4. "category" : une seule valeur parmi "Robes", "Hauts", "Bas", "Vestes", "Accessoires".
5. "confidence" : 0 à 1, reflète ta certitude sur le jugement morphologique.
6. Aucune autre clé. JSON pur uniquement.

Exemples :
Vêtement : Blazer oversize épaules structurées, coupe droite
→ {"tags":["poire","rectangle","pomme"],"category":"Vestes","confidence":0.85}
Vêtement : T-shirt basique coton, coupe droite
→ {"tags":["sablier","poire","pomme","rectangle","triangle_inverse"],"category":"Hauts","confidence":0.6}`;

/**
 * Tague un vêtement via Gemini 2.0 Flash (même prompt que l'Edge Function
 * tag-morphology). Renvoie null si la clé est absente ou l'appel échoue —
 * l'appelant doit alors garder le tag heuristique (fallback silencieux,
 * ne bloque jamais l'import).
 */
async function tagWithGemini(apiKey, description) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: `Vêtement : ${description.slice(0, 500)}` }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                tags: { type: 'ARRAY', items: { type: 'STRING', enum: ALLOWED_TAGS } },
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
    if (!response.ok) return null;
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t) => ALLOWED_TAGS.includes(t))
      : [];
    const category = ['Robes', 'Hauts', 'Bas', 'Vestes', 'Accessoires'].includes(parsed.category)
      ? parsed.category
      : null;
    return { tags, category, confidence: Number(parsed.confidence) || 0 };
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  loadEnv();
  const feedUrl = process.env.AWIN_FEED_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'cuwtknywzfyvhuuvvrpd';

  if (!feedUrl) {
    console.error('AWIN_FEED_URL manquant dans .env');
    console.error('Awin → Outils → Create-a-Feed → CSV → copier l\'URL du flux');
    process.exit(1);
  }
  if (!dbPassword) {
    console.error('SUPABASE_DB_PASSWORD manquant dans .env');
    process.exit(1);
  }

  let csv;
  const localPath = feedUrl.startsWith('file://')
    ? feedUrl.slice('file://'.length)
    : fs.existsSync(feedUrl) ? feedUrl : null;

  if (localPath) {
    console.log(`Lecture du flux local : ${localPath}`);
    const raw = fs.readFileSync(localPath);
    csv = localPath.endsWith('.gz')
      ? (await gunzip(raw)).toString('utf8')
      : raw.toString('utf8');
  } else {
    if (feedUrl.includes('/feedList')) {
      throw new Error(
        'AWIN_FEED_URL pointe vers feedList (page HTML). Copie une URL de la colonne URL dans datafeeds.csv',
      );
    }
    console.log('Téléchargement du flux Awin...');
    const { buffer, contentType } = await downloadFeed(feedUrl);
    const isZip =
      feedUrl.endsWith('.zip') ||
      /application\/(x-)?zip/i.test(contentType);
    if (isZip) {
      throw new Error('Flux ZIP non supporté — utilise CSV ou CSV.GZ');
    }

    const isGzip =
      feedUrl.includes('.gz') ||
      feedUrl.includes('compression/gzip') ||
      contentType.includes('gzip') ||
      (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b);
    csv = isGzip ? (await gunzip(buffer)).toString('utf8') : buffer.toString('utf8');
  }

  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('Flux vide');

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  const idx = {
    id: col('aw_product_id'),
    name: col('product_name'),
    brand: col('brand_name'),
    price: col('search_price'),
    rrp: col('rrp_price'),
    currency: col('currency'),
    image: col('aw_image_url') !== -1 ? col('aw_image_url') : col('merchant_image_url'),
    deeplink: col('aw_deep_link'),
    merchantId: col('merchant_id'),
    description: col('description'),
    category: col('merchant_category'),
  };
  const sizeIdx = findSizeColumn(header);
  const colourIdx = findColourColumn(header);
  if (idx.id === -1 || idx.name === -1 || idx.price === -1 || idx.deeplink === -1) {
    throw new Error(`Colonnes Awin manquantes. Header: ${header.join(', ')}`);
  }

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const price = parseFloat(cells[idx.price] ?? '');
    if (!cells[idx.id] || !cells[idx.name] || Number.isNaN(price) || price <= 0) continue;

    const merchantCat = idx.category !== -1 ? cells[idx.category] : '';
    const description = idx.description !== -1 ? cells[idx.description] : '';
    if (!isClothingProduct(cells[idx.name], merchantCat)) continue;

    const rrp = idx.rrp !== -1 ? parseFloat(cells[idx.rrp] ?? '') : NaN;
    const haystack = `${cells[idx.name]} ${description} ${merchantCat}`;

    rows.push({
      id: `awin-${cells[idx.id]}`,
      name: cells[idx.name].slice(0, 200),
      brand: idx.brand !== -1 && cells[idx.brand] ? cells[idx.brand].toUpperCase() : 'MODE',
      price,
      original_price: !Number.isNaN(rrp) && rrp > price ? rrp : null,
      currency: idx.currency !== -1 && cells[idx.currency] ? cells[idx.currency] : 'EUR',
      image: idx.image !== -1 ? cells[idx.image] : null,
      url: cells[idx.deeplink],
      awin_mid: idx.merchantId !== -1 ? cells[idx.merchantId] : null,
      tags: inferTags(haystack),
      category: inferCategory(haystack),
      modest: MODEST_PATTERN.test(haystack),
      sizes: extractSizes(cells, sizeIdx, cells[idx.name], description),
      colours: extractColours(cells, colourIdx, cells[idx.name], description),
      gender: inferGender(haystack),
    });
    if (rows.length >= 1000) break;
  }

  if (rows.length === 0) {
    console.warn('Aucun vêtement trouvé dans ce flux — essaie un flux mode (ex. Bodycross FR dans datafeeds.csv)');
  }

  console.log(`${rows.length} vêtements parsés — insertion dans Supabase...`);

  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // --- Tagging morphologique via Gemini (source de vérité), avec cache et
  // repli sur l'heuristique. On ne re-tague jamais un produit déjà tagué
  // par Gemini lors d'un run précédent (économise le quota gratuit).
  const geminiKey = process.env.GEMINI_API_KEY;
  const tagLimit = Number(process.env.GEMINI_TAG_LIMIT) || 200;
  if (rows.length > 0) {
    const { rows: existing } = await client.query(
      `SELECT id, tags, category, tag_source FROM public.products WHERE id = ANY($1)`,
      [rows.map((r) => r.id)],
    );
    const cached = new Map(existing.map((r) => [r.id, r]));

    let geminiCalls = 0;
    let geminiFailures = 0;
    for (const row of rows) {
      const prev = cached.get(row.id);
      if (prev?.tag_source === 'gemini') {
        // Déjà tagué par Gemini précédemment : on garde tel quel.
        row.tags = prev.tags;
        row.category = prev.category;
        row.tag_source = 'gemini';
        continue;
      }
      if (!geminiKey || geminiCalls >= tagLimit) {
        row.tag_source = 'heuristic';
        continue;
      }
      geminiCalls += 1;
      const description = `${row.name}`;
      const result = await tagWithGemini(geminiKey, description);
      if (result) {
        row.tags = result.tags.length > 0 ? result.tags : ALLOWED_TAGS.slice();
        if (result.category) row.category = result.category;
        row.tag_source = 'gemini';
      } else {
        geminiFailures += 1;
        row.tag_source = 'heuristic';
      }
      await sleep(150); // reste sous les limites de débit du tier gratuit
    }
    if (geminiKey) {
      console.log(
        `Tagging Gemini : ${geminiCalls - geminiFailures}/${geminiCalls} réussis` +
          (rows.length - geminiCalls > 0
            ? `, ${rows.length - geminiCalls} article(s) laissés en heuristique (cache ou quota)`
            : ''),
      );
    } else {
      console.log('GEMINI_API_KEY absente : tagging heuristique uniquement (voir audit-tags.js).');
    }
  }

  const cols = ['id', 'name', 'brand', 'price', 'original_price', 'currency', 'image', 'url', 'awin_mid', 'tags', 'category', 'modest', 'sizes', 'colours', 'gender', 'tag_source'];
  const values = [];
  const params = [];
  let p = 1;
  for (const row of rows) {
    values.push(
      `($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++})`,
    );
    params.push(
      row.id, row.name, row.brand, row.price, row.original_price, row.currency,
      row.image, row.url, row.awin_mid, row.tags, row.category, row.modest, row.sizes, row.colours, row.gender,
      row.tag_source ?? 'heuristic',
    );
  }

  if (rows.length > 0) {
    const sql = `
    INSERT INTO public.products (${cols.join(', ')})
    VALUES ${values.join(', ')}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      brand = EXCLUDED.brand,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      currency = EXCLUDED.currency,
      image = EXCLUDED.image,
      url = EXCLUDED.url,
      awin_mid = EXCLUDED.awin_mid,
      tags = EXCLUDED.tags,
      category = EXCLUDED.category,
      modest = EXCLUDED.modest,
      sizes = EXCLUDED.sizes,
      colours = EXCLUDED.colours,
      gender = EXCLUDED.gender,
      tag_source = EXCLUDED.tag_source,
      updated_at = now()
  `;
    await client.query(sql, params);
  }

  await client.query(`
    DELETE FROM public.products
    WHERE name ~* 'savon|soap|carte cadeau|gift card|parfum|perfume|bougie|candle|crème|cream|sérum|serum'
       OR price <= 0
  `);
  await client.end();

  console.log(`Import terminé : ${rows.length} articles dans products`);
}

main().catch((e) => {
  console.error('Échec import :', e.message);
  if (e.cause?.message) console.error('Cause :', e.cause.message);
  process.exit(1);
});
