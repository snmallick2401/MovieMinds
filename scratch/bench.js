const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : fs.readFileSync('.env', 'utf-8');
  let url = '';
  for (const line of env.split('\n')) {
    if (line.startsWith('DATABASE_URL=')) {
      url = line.split('=')[1].trim().replace(/^"|"$/g, '');
      break;
    }
  }

  // To measure raw latency, we should strip pgbouncer param
  const cleanUrl = url.replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');

  console.log("Connecting directly using pg module...");
  
  const client = new Client({ connectionString: cleanUrl });
  
  const connectStart = performance.now();
  await client.connect();
  const connectTime = performance.now() - connectStart;
  console.log(`Connection established in ${connectTime.toFixed(2)} ms`);

  for (let i = 1; i <= 3; i++) {
    const queryStart = performance.now();
    await client.query('SELECT 1');
    const queryTime = performance.now() - queryStart;
    console.log(`SELECT 1 (Attempt ${i}): ${queryTime.toFixed(2)} ms`);
  }

  for (let i = 1; i <= 3; i++) {
    const txStart = performance.now();
    await client.query('BEGIN');
    await client.query('SELECT 1');
    await client.query('COMMIT');
    const txTime = performance.now() - txStart;
    console.log(`BEGIN/SELECT 1/COMMIT (Attempt ${i}): ${txTime.toFixed(2)} ms`);
  }

  await client.end();
}

main().catch(console.error);
