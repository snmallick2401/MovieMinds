const { createClient } = require('@supabase/supabase-js');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchPage(url, cookie) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    http.get(url, { headers: { Cookie: cookie } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        console.log(`Redirected to: ${res.headers.location}`);
      }
      res.on('data', () => {});
      res.on('end', () => resolve(performance.now() - start));
    }).on('error', reject);
  });
}

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'snmallick2401@gmail.com',
    password: 's9939668767'
  });
  
  if (error) {
    console.error('Login failed:', error.message);
    return;
  }
  
  const cookie = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${encodeURIComponent(JSON.stringify(data.session))}`;
  
  const url = 'http://127.0.0.1:3000/media/cmsm9jau700c8v6p8axmwieud';
  console.log(`Warming up ${url}...`);
  try {
    const cold = await fetchPage(url, cookie);
    console.log(`Cold load: ${cold.toFixed(2)} ms`);
    
    for(let i = 1; i <= 3; i++) {
      const warm = await fetchPage(url, cookie);
      console.log(`Warm load ${i}: ${warm.toFixed(2)} ms`);
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

main();
