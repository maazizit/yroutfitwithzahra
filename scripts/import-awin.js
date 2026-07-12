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
const TAG_RULES = [
  [/wrap|portefeuille|cintr|belted|ceintur|bodycon|moulant/i, ['sablier']],
  [/a-line|évasé|evase|trapèze|trapeze|flare/i, ['poire', 'triangle_inverse']],
  [/empire|fluide|flowy|v-neck|col v|drap/i, ['pomme']],
  [/peplum|volant|ruffle|volume/i, ['rectangle']],
  [/wide leg|palazzo|large/i, ['triangle_inverse', 'poire']],
];

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

function inferTags(text) {
  const tags = new Set();
  for (const [pattern, matched] of TAG_RULES) {
    if (pattern.test(text)) matched.forEach((t) => tags.add(t));
  }
  if (tags.size === 0) ['sablier', 'rectangle'].forEach((t) => tags.add(t));
  return [...tags].filter((t) => ALLOWED_TAGS.includes(t));
}

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
  if (idx.id === -1 || idx.name === -1 || idx.price === -1 || idx.deeplink === -1) {
    throw new Error(`Colonnes Awin manquantes. Header: ${header.join(', ')}`);
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
    });
    if (rows.length >= 1000) break;
  }

  console.log(`${rows.length} produits parsés — insertion dans Supabase...`);

  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const cols = ['id', 'name', 'brand', 'price', 'original_price', 'currency', 'image', 'url', 'awin_mid', 'tags', 'category', 'modest'];
  const values = [];
  const params = [];
  let p = 1;
  for (const row of rows) {
    values.push(
      `($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++})`,
    );
    params.push(
      row.id, row.name, row.brand, row.price, row.original_price, row.currency,
      row.image, row.url, row.awin_mid, row.tags, row.category, row.modest,
    );
  }

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
      updated_at = now()
  `;
  await client.query(sql, params);
  await client.end();

  console.log(`Import terminé : ${rows.length} articles dans products`);
}

main().catch((e) => {
  console.error('Échec import :', e.message);
  if (e.cause?.message) console.error('Cause :', e.cause.message);
  process.exit(1);
});
