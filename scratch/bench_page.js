const http = require('http');

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    http.get(url, (res) => {
      if (res.statusCode === 307 || res.statusCode === 308 || res.statusCode === 301 || res.statusCode === 302) {
        console.log(`Redirected to: ${res.headers.location}`);
      }
      res.on('data', () => {});
      res.on('end', () => resolve(performance.now() - start));
    }).on('error', reject);
  });
}

async function main() {
  const url = 'http://127.0.0.1:3000/media/cmsm9jau700c8v6p8axmwieud';
  console.log(`Warming up ${url}...`);
  try {
    const cold = await fetchPage(url);
    console.log(`Cold load: ${cold.toFixed(2)} ms`);
    
    for(let i = 1; i <= 3; i++) {
      const warm = await fetchPage(url);
      console.log(`Warm load ${i}: ${warm.toFixed(2)} ms`);
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

setTimeout(main, 5000); // Wait 5 seconds for Next.js to start
