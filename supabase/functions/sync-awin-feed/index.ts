// Supabase Edge Function — sync-awin-feed
// Télécharge le flux produits Awin (CSV "Create-a-Feed") et alimente la table `products`.
// À planifier 1 à 2 fois par jour (voir supabase/schema.sql pour le cron pg_cron).
//
// Déploiement :
//   supabase functions deploy sync-awin-feed
//   supabase secrets set AWIN_FEED_URL=<url_du_flux_create-a-feed>
//   (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectées automatiquement par Supabase)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_TAGS = ['sablier', 'poire', 'pomme', 'rectangle', 'triangle_inverse'];

const CATEGORY_MAP: Array<[RegExp, string]> = [
  [/dress|robe/i, 'Robes'],
  [/top|shirt|blouse|tee|pull|sweat|chemis/i, 'Hauts'],
  [/pant|jean|skirt|jupe|trouser|short|legging/i, 'Bas'],
  [/jacket|coat|blazer|veste|manteau|gilet/i, 'Vestes'],
  [/belt|bag|scarf|ceinture|sac|bijou|accessor/i, 'Accessoires'],
];

/** Heuristique de tagging morpho par mots-clés — affinée ensuite par Gemini (tag-morphology). */
const TAG_RULES: Array<[RegExp, string[]]> = [
  [/wrap|portefeuille|cintr|belted|ceintur|bodycon|moulant/i, ['sablier']],
  [/a-line|évasé|evase|trapèze|trapeze|flare/i, ['poire', 'triangle_inverse']],
  [/empire|fluide|flowy|v-neck|col v|drap/i, ['pomme']],
  [/peplum|volant|ruffle|volume/i, ['rectangle']],
  [/wide leg|palazzo|large/i, ['triangle_inverse', 'poire']],
];

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function inferCategory(text: string): string {
  for (const [pattern, category] of CATEGORY_MAP) {
    if (pattern.test(text)) return category;
  }
  return 'Hauts';
}

function inferTags(text: string): string[] {
  const tags = new Set<string>();
  for (const [pattern, matched] of TAG_RULES) {
    if (pattern.test(text)) matched.forEach((t) => tags.add(t));
  }
  if (tags.size === 0) {
    // Article neutre : visible pour toutes les silhouettes courantes.
    ['sablier', 'rectangle'].forEach((t) => tags.add(t));
  }
  return [...tags].filter((t) => ALLOWED_TAGS.includes(t));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 });
  }

  const feedUrl = Deno.env.get('AWIN_FEED_URL');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!feedUrl || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: 'AWIN_FEED_URL / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants' }),
      { status: 500 },
    );
  }

  const feedResponse = await fetch(feedUrl);
  if (!feedResponse.ok) {
    return new Response(JSON.stringify({ error: `Flux Awin inaccessible (${feedResponse.status})` }), {
      status: 502,
    });
  }

  const csv = await feedResponse.text();
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return new Response(JSON.stringify({ error: 'Flux vide' }), { status: 502 });
  }

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  // Colonnes standard du format Awin "Create-a-Feed"
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
  if (idx.id === -1 || idx.name === -1 || idx.price === -1 || idx.deeplink === -1) {
    return new Response(
      JSON.stringify({ error: 'Colonnes Awin attendues manquantes', header }),
      { status: 502 },
    );
  }

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const price = parseFloat(cells[idx.price] ?? '');
    if (!cells[idx.id] || !cells[idx.name] || Number.isNaN(price)) continue;

    const rrp = idx.rrp !== -1 ? parseFloat(cells[idx.rrp] ?? '') : NaN;
    const haystack = `${cells[idx.name]} ${idx.description !== -1 ? cells[idx.description] : ''} ${
      idx.category !== -1 ? cells[idx.category] : ''
    }`;

    rows.push({
      id: `awin-${cells[idx.id]}`,
      name: cells[idx.name].slice(0, 200),
      brand: idx.brand !== -1 && cells[idx.brand] ? cells[idx.brand].toUpperCase() : 'SHEIN',
      price,
      original_price: !Number.isNaN(rrp) && rrp > price ? rrp : null,
      currency: idx.currency !== -1 && cells[idx.currency] ? cells[idx.currency] : 'EUR',
      image: idx.image !== -1 ? cells[idx.image] : null,
      url: cells[idx.deeplink],
      awin_mid: idx.merchantId !== -1 ? cells[idx.merchantId] : null,
      tags: inferTags(haystack),
      category: inferCategory(haystack),
    });
    if (rows.length >= 1000) break; // garde-fou tier gratuit
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ imported: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
