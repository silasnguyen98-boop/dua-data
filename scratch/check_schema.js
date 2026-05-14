require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses'
    `);
    console.log("Columns and Types in 'courses' table:");
    res.rows.forEach(r => {
      console.log(`${r.column_name}: ${r.data_type}`);
    });
    await pool.end();
  } catch (err) {
    console.error("Error checking schema:", err);
  }
}

checkSchema();
