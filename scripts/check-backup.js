const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
console.log('check-backup script started');
let dbUrl = process.env.DATABASE_URL;
const envPath = path.resolve('.env.local');
if (!dbUrl && fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/DATABASE_URL=(.*)/);
  if (m) dbUrl = m[1].trim();
}
if (!dbUrl) {
  console.error('no db url');
  process.exit(1);
}
const client = new Client({ connectionString: dbUrl });
console.log('about to connect');
(async () => {
  await client.connect();
  console.log('connected');
  const exists = await client.query("SELECT to_regclass('public.json_backups')");
  console.log('table:', exists.rows[0].to_regclass);
  if (exists.rows[0].to_regclass) {
    const count = await client.query('SELECT count(*) FROM public.json_backups');
    console.log('count:', count.rows[0].count);
    const sample = await client.query('SELECT id, source_filename, created_at FROM public.json_backups ORDER BY created_at DESC LIMIT 5');
    console.log(sample.rows);
  }
  await client.end();
})().catch(err=>{ console.error(err); process.exit(1); });
