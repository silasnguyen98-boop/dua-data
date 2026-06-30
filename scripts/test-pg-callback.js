const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://duadata:DuaDataPg2026x9KpV4sR@160.191.50.13:5432/duadata'
});
const connectTimeout = setTimeout(() => {
  console.log('pgConnect timeout after 10s');
  process.exit(1);
}, 10000);
client.connect((err) => {
  clearTimeout(connectTimeout);
  if (err) {
    console.log('connect error:', err.message);
    process.exit(1);
  }
  console.log('PG connected successfully');
  client.query('SELECT 1', (err, res) => {
    if (err) {
      console.log('query error:', err.message);
    } else {
      console.log('query ok');
    }
    client.end(() => {
      console.log('disconnected');
    });
  });
});
