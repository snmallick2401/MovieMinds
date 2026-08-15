import puppeteer from "puppeteer";

async function main() {
  console.log("=== STARTING EXPLORE PAGE VERIFICATION ===\n");
  const results: Record<string, { pass: boolean; details: string }> = {};

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  const page = await browser.newPage();
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console: ${msg.text()}`);
    }
  });

  page.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      errors.push(`Network: ${request.url()} - ${request.failure()?.errorText}`);
    }
  });

  try {
    // Login first
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.type("input[name='email']", "roloy63370@lanvos.com");
    await page.type("input[name='password']", "12345678");
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    // EXP-01: Explore page loads
    await page.goto("http://localhost:3000/explore", { waitUntil: "networkidle0" });
    if (page.url().includes("/explore")) {
      results["EXP-01"] = { pass: true, details: "Explore page loaded successfully." };
    } else {
      results["EXP-01"] = { pass: false, details: "Failed to load explore page." };
    }

    // EXP-02: Movies filter works
    await page.goto("http://localhost:3000/explore?type=MOVIE", { waitUntil: "networkidle0" });
    let cards = await page.$$("a[href^='/media/']");
    results["EXP-02"] = { pass: cards.length > 0, details: `Movies filter returned ${cards.length} results.` };

    // EXP-03: TV filter works
    await page.goto("http://localhost:3000/explore?type=TV", { waitUntil: "networkidle0" });
    cards = await page.$$("a[href^='/media/']");
    results["EXP-03"] = { pass: cards.length > 0, details: `TV filter returned ${cards.length} results.` };

    // EXP-04: Anime filter works
    await page.goto("http://localhost:3000/explore?type=ANIME,ANIME_MOVIE", { waitUntil: "networkidle0" });
    cards = await page.$$("a[href^='/media/']");
    results["EXP-04"] = { pass: cards.length > 0, details: `Anime filter returned ${cards.length} results.` };

    // EXP-05: Genre filter works
    await page.goto("http://localhost:3000/explore?genre=Drama", { waitUntil: "networkidle0" });
    cards = await page.$$("a[href^='/media/']");
    results["EXP-05"] = { pass: cards.length > 0, details: `Genre filter returned ${cards.length} results.` };

    // EXP-06: Sorting works
    await page.goto("http://localhost:3000/explore?sort=rating", { waitUntil: "networkidle0" });
    cards = await page.$$("a[href^='/media/']");
    results["EXP-06"] = { pass: cards.length > 0, details: `Sorting by rating returned ${cards.length} results.` };

    // EXP-07: Pagination works
    await page.goto("http://localhost:3000/explore?page=2", { waitUntil: "networkidle0" });
    cards = await page.$$("a[href^='/media/']");
    results["EXP-07"] = { pass: cards.length > 0, details: `Pagination (page 2) returned ${cards.length} results.` };

    // EXP-08: URL query state persists
    // Reload the page and check if URL is still ?page=2 and cards exist
    await page.reload({ waitUntil: "networkidle0" });
    cards = await page.$$("a[href^='/media/']");
    if (page.url().includes("page=2") && cards.length > 0) {
      results["EXP-08"] = { pass: true, details: "URL query state persists after reload." };
    } else {
      results["EXP-08"] = { pass: false, details: `Query state lost. URL: ${page.url()}` };
    }

  } catch (err: any) {
    console.error("Test execution failed:", err);
    results["ERROR"] = { pass: false, details: err.message };
  } finally {
    await browser.close();
  }

  console.log("\n=== SUMMARY OF RESULTS ===\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
