const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
let dbUrl = process.env.DATABASE_URL;
const envPath = path.resolve('.env.local');
if (!dbUrl && fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/DATABASE_URL=(.*)/);
  if (m) dbUrl = m[1].trim();
}
console.log('dbUrl', !!dbUrl);
if (!dbUrl) process.exit(1);
const client = new Client({ connectionString: dbUrl });
const timer = setInterval(() => {}, 1000);
client.connect()
  .then(() => {
    console.log('connected');
    return client.end();
  })
  .then(() => {
    console.log('ended');
    clearInterval(timer);
  })
  .catch((err) => {
    console.error('connect error', err.message || err);
    process.exit(1);
  });
