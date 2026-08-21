const { createClient } = require('@supabase/supabase-js');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function fetchUrl(url, cookie) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.get(url, {
      headers: {
        Cookie: cookie,
        'User-Agent': 'MovieMinds-Benchmarker/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({
          status: res.statusCode,
          duration,
          bytes: data.length,
          redirect: res.headers.location
        });
      });
    });
    req.on('error', reject);
  });
}

function stats(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { min, avg, median, max };
}

async function runBenchmark() {
  console.log('--- Phase 7 Benchmark Starting ---');
  console.log('Authenticating test user: snmallick2401@gmail.com ...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'snmallick2401@gmail.com',
    password: 's9939668767'
  });

  if (error || !data?.session) {
    console.error('Authentication failed:', error?.message);
    process.exit(1);
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookie = `sb-${projectRef}-auth-token=${encodeURIComponent(JSON.stringify(data.session))}`;
  console.log('Authenticated successfully.\n');

  const routes = [
    { name: 'Media Detail', path: '/media/cmsm9bvxg003ev6p8b15cvnp2' },
    { name: 'Homepage', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'Search', path: '/explore?q=batman' },
    { name: 'Profile', path: '/profile' },
    { name: 'Library', path: '/library' },
  ];

  const results = {};

  for (const r of routes) {
    const fullUrl = `http://127.0.0.1:3000${r.path}`;
    console.log(`Testing route: ${r.name} (${r.path})...`);
    
    // Warmup request
    const warmup = await fetchUrl(fullUrl, cookie);
    console.log(`  Warmup (Cold): ${warmup.duration.toFixed(2)}ms (Status: ${warmup.status})`);

    const warmTimes = [];
    for (let i = 1; i <= 5; i++) {
      const res = await fetchUrl(fullUrl, cookie);
      console.log(`  Run ${i}: ${res.duration.toFixed(2)}ms (Status: ${res.status}, Size: ${(res.bytes / 1024).toFixed(1)} KB)`);
      warmTimes.push(res.duration);
    }

    const { min, avg, median, max } = stats(warmTimes);
    results[r.name] = { min, avg, median, max, runs: warmTimes };
    console.log(`  -> Min: ${min.toFixed(2)}ms | Avg: ${avg.toFixed(2)}ms | Median: ${median.toFixed(2)}ms | Max: ${max.toFixed(2)}ms\n`);
  }

  console.log('========================================');
  console.log('PHASE 7 BENCHMARK SUMMARY TABLE:');
  console.log('========================================');
  console.table(
    Object.entries(results).map(([name, data]) => ({
      Route: name,
      'Min (ms)': data.min.toFixed(1),
      'Avg (ms)': data.avg.toFixed(1),
      'Median (ms)': data.median.toFixed(1),
      'Max (ms)': data.max.toFixed(1),
    }))
  );
}

runBenchmark().catch(err => {
  console.error('Benchmark error:', err);
});
