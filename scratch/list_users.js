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

async function listUsers() {
  try {
    const res = await pool.query('SELECT name, email, created_at FROM auth.users');
    console.log('Users:');
    res.rows.forEach(row => console.log(`- ${row.name} (${row.email}) - Created at: ${row.created_at}`));
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await pool.end();
  }
}

listUsers();
