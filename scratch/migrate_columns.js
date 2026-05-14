require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE');
    await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS hide_price BOOLEAN DEFAULT FALSE');
    console.log('Migration successful: columns is_hidden and hide_price added.');
    await pool.end();
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
