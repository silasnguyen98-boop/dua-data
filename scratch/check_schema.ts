import { query } from "@/lib/db";

async function checkSchema() {
  try {
    const { rows } = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses'
    `);
    console.log("Columns in 'courses' table:");
    console.log(rows.map(r => r.column_name).join(", "));
  } catch (err) {
    console.error("Error checking schema:", err);
  }
}

checkSchema();
