import pg from 'pg';
const { Client } = pg;
const connectionString = "postgresql://duadata:DuaDataPg2026x9KpV4sR@160.191.50.13:5432/duadata";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Creating auth schema...");
    await client.query("CREATE SCHEMA IF NOT EXISTS auth;");
    
    console.log("Creating auth.users table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth.users (
        id text PRIMARY KEY,
        email text UNIQUE NOT NULL,
        name text,
        image text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);
    console.log("✅ Created auth schema and users table successfully");
  } catch (err) {
    console.error("❌ Failed to create auth table:", err);
  } finally {
    await client.end();
  }
}
run();
