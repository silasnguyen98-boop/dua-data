import pg from 'pg';
const { Client } = pg;
const connectionString = "postgresql://duadata:DuaDataPg2026x9KpV4sR@160.191.50.13:5432/duadata";

async function check() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const resSchemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'");
    console.log("Auth schema exists:", resSchemas.rows.length > 0);
    
    if (resSchemas.rows.length > 0) {
      const resTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth'");
      console.log("Auth tables:", resTables.rows.map(r => r.table_name));
    }
  } finally {
    await client.end();
  }
}
check();
