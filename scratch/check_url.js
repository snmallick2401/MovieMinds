const fs = require('fs');
const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : fs.readFileSync('.env', 'utf-8');
const lines = env.split('\n');
for (const line of lines) {
  if (line.startsWith('DATABASE_URL=')) {
    try {
      const val = line.split('=')[1].trim().replace(/^"|"$/g, '');
      const url = new URL(val);
      console.log('DATABASE_URL connection string analysis:');
      console.log('Host:', url.hostname);
      console.log('Port:', url.port);
      console.log('Params:', url.searchParams.toString());
      if (url.port === '6543') {
        console.log('This is using Supabase Transaction Pooler (port 6543).');
      } else if (url.port === '5432') {
        console.log('This is using Supabase Direct Connection or Session Pooler (port 5432).');
      }
    } catch (e) { console.log('Error parsing URL'); }
  }
}
