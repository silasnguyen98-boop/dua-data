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

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);
    console.log('Tables in database:');
    res.rows.forEach(row => console.log(`${row.table_schema}.${row.table_name}`));
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await pool.end();
  }
}

listTables();
