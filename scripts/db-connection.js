/**
 * Connexion Postgres partagée (local + GitHub Actions).
 * Privilégie SUPABASE_DB_URL (Session pooler, IPv4).
 */
function trimSecret(value) {
  if (value == null || value === '') return '';
  return String(value).replace(/\r/g, '').replace(/\n/g, '').trim();
}

function resolveDbConnection() {
  const dbUrl = trimSecret(process.env.SUPABASE_DB_URL);
  if (dbUrl) {
    return { connectionString: dbUrl, ssl: { rejectUnauthorized: false } };
  }

  const dbPassword = trimSecret(process.env.SUPABASE_DB_PASSWORD);
  const projectRef = trimSecret(process.env.SUPABASE_PROJECT_REF) || 'cuwtknywzfyvhuuvvrpd';
  if (!dbPassword) return null;

  return {
    connectionString: `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  };
}

module.exports = { trimSecret, resolveDbConnection };
