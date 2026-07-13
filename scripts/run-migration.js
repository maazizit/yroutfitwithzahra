#!/usr/bin/env node
/**
 * Exécute un fichier SQL de migration contre la base Supabase.
 * Usage: node scripts/run-migration.js supabase/migrations/XXXX.sql
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { resolveDbConnection } = require('./db-connection');

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

loadDotEnv();

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-migration.js <fichier.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(file), 'utf8');
const dbConfig = resolveDbConnection();
if (!dbConfig) {
  console.error('SUPABASE_DB_URL (recommandé) ou SUPABASE_DB_PASSWORD manquant');
  process.exit(1);
}

async function main() {
  const client = new Client(dbConfig);
  await client.connect();
  await client.query(sql);
  console.log('Migration OK:', file);
  await client.end();
}

main().catch((e) => {
  console.error('ERREUR:', e.message);
  process.exit(1);
});
