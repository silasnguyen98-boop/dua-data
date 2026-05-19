const { Pool } = require('pg');
const fs = require('fs');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envContent = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
  return envContent.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
});

async function countUsers() {
  try {
    const res = await pool.query('SELECT count(*) FROM auth.users');
    console.log('Number of logged in users:', res.rows[0].count);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await pool.end();
  }
}

countUsers();
