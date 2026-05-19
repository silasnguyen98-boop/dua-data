import { Client } from "pg";
import * as fs from "fs";

async function migrate() {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim();

  if (!dbUrl) {
    console.error("DATABASE_URL not found in .env.local");
    return;
  }

  const client = new Client({
    connectionString: dbUrl
  });
  try {
    await client.connect();
    console.log("Connected to DB. Adding columns...");
    await client.query(`
      ALTER TABLE mail_logs 
      ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
    `);
    console.log("Migration successful.");
    await client.end();
  } catch (err) {
    console.error("Migration failed:", err);
  }
}
migrate();
