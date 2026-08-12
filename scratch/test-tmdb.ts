async function test(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    console.log(`[SUCCESS] ${url} -> Status: ${res.status}`);
  } catch (err: any) {
    console.log(`[FAILED] ${url} -> ${err.message}`);
  }
}

async function run() {
  const apiKey = "92d582eb09fc8d13bce2febf3dcd2d46";
  const path = `/movie/24428?api_key=${apiKey}`;
  
  await test(`https://api.themoviedb.org/3${path}`);
  await test(`https://api.tmdb.org/3${path}`);
}

run();
