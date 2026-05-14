import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function listTables() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // This is a bit of a hack since Supabase JS doesn't have a direct "list tables" method for public
  // but we can try to query one that we know exists or use RPC if defined.
  // Alternatively, we can try to query postgres information_schema via RPC if possible.
  
  const { data, error } = await supabase.from('courses').select('id').limit(1);
  console.log('Courses exists:', !error);
  
  const { error: nrError } = await supabase.from('newsletter_recipients').select('id').limit(1);
  console.log('Newsletter Recipients exists:', !nrError, nrError?.message);
}

listTables();
