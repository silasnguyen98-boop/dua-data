import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://duadata:DuaDataPg2026x9KpV4sR@160.191.50.13:5432/duadata";

async function checkTable() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'courses'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkTable();
