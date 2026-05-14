import pg from 'pg';
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Simple .env.local loader
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const pgConnectionString = process.env.DATABASE_URL || "postgresql://duadata:DuaDataPg2026x9KpV4sR@160.191.50.13:5432/duadata";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function copyTable(supabase, pgClient, tableName, conflictColumn = 'id') {
  console.log(`\n--- Migrating ${tableName} ---`);
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return;
  }
  console.log(`Found ${data.length} rows in ${tableName}`);

  for (const row of data) {
    const columns = Object.keys(row);
    const values = Object.values(row).map(val => {
      if (val !== null && typeof val === 'object') {
        return JSON.stringify(val);
      }
      return val;
    });
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    await pgClient.query(
      `INSERT INTO public.${tableName} (${columns.join(', ')}) 
       VALUES (${placeholders}) 
       ON CONFLICT (${conflictColumn}) 
       DO UPDATE SET ${columns.map(c => `${c} = EXCLUDED.${c}`).join(', ')}`,
      values
    );
  }
  console.log(`✅ ${tableName} migrated`);
}

async function run() {
  const pgClient = new Client({ connectionString: pgConnectionString });
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    await pgClient.connect();
    
    await copyTable(supabase, pgClient, 'experts');
    await copyTable(supabase, pgClient, 'newsletter_recipients', 'user_id');
    await copyTable(supabase, pgClient, 'newsletter_settings');
    await copyTable(supabase, pgClient, 'course_registrations');
    await copyTable(supabase, pgClient, 'mail_logs');
    await copyTable(supabase, pgClient, 'course_mail_templates');

  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    await pgClient.end();
  }
}

run();
