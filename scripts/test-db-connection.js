#!/usr/bin/env node
/**
 * Teste la/les connexion(s) PostgreSQL à Supabase disponibles en local.
 * Teste SUPABASE_DB_URL (Session pooler, IPv4 — celle qu'il faut pour
 * GitHub Actions) si elle est définie, et/ou la connexion directe
 * (SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF, IPv6-only côté Supabase —
 * marche en local si ton réseau a l'IPv6, jamais depuis un runner CI).
 *
 * Usage:
 *   npm run test:db
 *   node scripts/test-db-connection.js
 *
 * Prérequis dans .env (au moins un des deux) :
 *   SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-xx-xxxx-x.pooler.supabase.com:5432/postgres
 *   SUPABASE_DB_PASSWORD=...  (+ SUPABASE_PROJECT_REF optionnel)
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

function maskPassword(pwd) {
  if (!pwd || pwd.length < 2) return '***';
  return `${pwd[0]}${'*'.repeat(Math.min(pwd.length - 2, 8))}${pwd[pwd.length - 1]}`;
}

function maskConnectionString(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = maskPassword(u.password);
    return u.toString();
  } catch {
    return '(URL illisible)';
  }
}

loadDotEnv();

async function testConnection(label, config) {
  console.log(`— ${label} —`);
  const client = new Client({ ...config, connectionTimeoutMillis: 15000 });
  const started = Date.now();
  try {
    await client.connect();
    const ms = Date.now() - started;
    const info = await client.query(
      `SELECT current_database() AS db, current_user AS "user", version() AS version`,
    );
    const row = info.rows[0];
    let productCount = null;
    try {
      const count = await client.query(`SELECT count(*)::int AS n FROM public.products`);
      productCount = count.rows[0]?.n;
    } catch {
      productCount = '(table products absente ou inaccessible)';
    }
    console.log(`✅ Connexion OK (${ms} ms)`);
    console.log(`   DB      : ${row.db}`);
    console.log(`   User    : ${row.user}`);
    console.log(`   Version : ${String(row.version).split(',')[0]}`);
    if (productCount !== null) console.log(`   Produits: ${productCount}`);
    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Échec de connexion');
    if (err.code === 'ENOTFOUND') {
      console.error('   Hôte introuvable — vérifie le nom d\'hôte.');
    } else if (err.code === '28P01') {
      console.error('   Mot de passe incorrect (28P01)');
      console.error('   Réinitialise-le : Dashboard → Settings → Database → Reset database password');
    } else if (err.code === 'ENETUNREACH' || err.message?.includes('unreachable')) {
      console.error('   Réseau injoignable — probablement IPv6 non supporté ici (normal en CI pour');
      console.error('   la connexion directe : utilise SUPABASE_DB_URL/Session pooler à la place).');
    } else if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      console.error('   Timeout réseau — firewall / VPN / proxy d\'entreprise ?');
    } else {
      console.error(`   ${err.message}`);
      if (err.code) console.error(`   Code : ${err.code}`);
    }
    try {
      await client.end();
    } catch {
      /* déjà fermé */
    }
    return false;
  }
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'cuwtknywzfyvhuuvvrpd';
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!dbUrl && !password) {
    console.error('❌ Ni SUPABASE_DB_URL ni SUPABASE_DB_PASSWORD trouvés dans .env');
    process.exit(1);
  }

  let anyOk = false;

  if (dbUrl) {
    console.log(`Session pooler : ${maskConnectionString(dbUrl)}\n`);
    const ok = await testConnection(
      'SUPABASE_DB_URL (Session pooler, IPv4 — celle qu\'il faut pour GitHub Actions)',
      { connectionString: dbUrl, ssl: { rejectUnauthorized: false } },
    );
    anyOk = anyOk || ok;
    console.log('');
  } else {
    console.log('ℹ️  SUPABASE_DB_URL non définie — teste seulement la connexion directe.\n');
  }

  if (password) {
    const host = `db.${projectRef}.supabase.co`;
    const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
    console.log(`Connexion directe : postgresql://postgres:${maskPassword(password)}@${host}:5432/postgres\n`);
    const ok = await testConnection(
      'SUPABASE_DB_PASSWORD (connexion directe, IPv6-only — ne marchera PAS en CI)',
      { connectionString, ssl: { rejectUnauthorized: false } },
    );
    anyOk = anyOk || ok;
  }

  process.exit(anyOk ? 0 : 1);
}

main();
