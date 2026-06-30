import fs from "fs";
import path from "path";
import { Client } from "pg";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function usage() {
  console.error("Usage: node scripts/backup-json-to-db.mjs <file.json> [another.json ...]");
  console.error("Example: node scripts/backup-json-to-db.mjs ~/Downloads/duadata-b0fb8-default-rtdb-export.json");
  process.exit(1);
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing. Set it in .env.local or export it in the environment.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await client.query(`
      CREATE TABLE IF NOT EXISTS json_backups (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        source_filename text NOT NULL,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW()
      );
    `);

    for (const fileArg of args) {
      const filePath = path.resolve(fileArg);
      if (!fs.existsSync(filePath)) {
        console.warn(`Skipping missing file: ${filePath}`);
        continue;
      }
      const raw = fs.readFileSync(filePath, "utf8");
      let json;
      try {
        json = JSON.parse(raw);
      } catch (err) {
        console.error(`Failed to parse JSON from ${filePath}: ${err.message}`);
        continue;
      }

      const result = await client.query(
        "INSERT INTO json_backups (source_filename, data) VALUES ($1, $2) RETURNING id",
        [path.basename(filePath), json]
      );
      console.log(`Backed up ${filePath} as id=${result.rows[0].id}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
