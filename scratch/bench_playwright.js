const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('http://127.0.0.1:3000/login');
  await page.fill('input[name="email"]', 'snmallick2401@gmail.com');
  await page.fill('input[name="password"]', 's9939668767');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);

  console.log('Logged in successfully. Measuring Media Detail page...');
  const url = 'http://127.0.0.1:3000/media/cmsm9jau700c8v6p8axmwieud';

  // Warmup
  console.log('Warming up...');
  await page.goto(url, { waitUntil: 'networkidle' });

  // Benchmark
  let totalTime = 0;
  const runs = 3;
  for (let i = 1; i <= runs; i++) {
    // Navigate away
    await page.goto('http://127.0.0.1:3000/explore', { waitUntil: 'networkidle' });
    
    // Navigate back to measure
    const start = performance.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for the important sections to load (Suspense boundaries)
    await page.waitForSelector('h2:has-text("Similar titles")', { state: 'visible' });
    const time = performance.now() - start;
    console.log(`Run ${i}: ${time.toFixed(2)} ms`);
    totalTime += time;
  }

  console.log(`Average: ${(totalTime / runs).toFixed(2)} ms`);

  await browser.close();
})();
