import { Client } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    const { rows } = await client.query("SELECT id, title FROM courses LIMIT 1");
    console.log("Course ID example:", rows[0]?.id, "Type:", typeof rows[0]?.id);
    await client.end();
  } catch (err) {
    console.error(err);
  }
}
check();
