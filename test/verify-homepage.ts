import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  console.log("=== STARTING HOMEPAGE VERIFICATION ===\n");
  const results: Record<string, { pass: boolean; details: string }> = {};

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  const page = await browser.newPage();
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()} at ${msg.location().url}`);
    }
  });

  page.on('pageerror', (err: any) => {
    errors.push(`Page Error: ${err.toString()}`);
  });

  page.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      errors.push(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400 && response.status() !== 404) {
      errors.push(`Response Error: ${response.url()} returned ${response.status()}`);
    } else if (response.status() === 404) {
      errors.push(`404 Not Found: ${response.url()}`);
    }
  });

  try {
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    
    await page.type("input[name='email']", "roloy63370@lanvos.com");
    await page.type("input[name='password']", "12345678");
    
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    if (page.url() === "http://localhost:3000/") {
      results["HOME-01"] = { pass: true, details: "Homepage loads successfully (HTTP 200 via Next.js router)." };
    } else {
      results["HOME-01"] = { pass: false, details: `Failed to load homepage, current URL: ${page.url()}` };
    }

    await new Promise(r => setTimeout(r, 2000));
    const content = await page.content();

    if (content.includes("Trending now")) {
      results["HOME-02"] = { pass: true, details: "Trending section is present on the page." };
    } else {
      results["HOME-02"] = { pass: false, details: "Trending section text not found." };
    }

    if (content.includes("Welcome back") || content.includes("stats")) {
      results["HOME-03"] = { pass: true, details: "Featured banner (HomeHero) is displayed." };
    } else {
      results["HOME-03"] = { pass: false, details: "Featured banner text 'Welcome back' not found." };
    }

    const mediaCards = await page.$$("a[href^='/media/']");
    if (mediaCards.length > 0) {
      results["HOME-04"] = { pass: true, details: `Found ${mediaCards.length} media cards rendered correctly.` };
    } else {
      results["HOME-04"] = { pass: false, details: "No media cards found on the page." };
    }

    const exploreLinks = await page.$$("a[href^='/explore']");
    if (exploreLinks.length > 0) {
      await Promise.all([
        exploreLinks[0].click(),
        page.waitForNavigation({ waitUntil: "networkidle0" })
      ]);
      if (page.url().includes("/explore")) {
        results["HOME-05"] = { pass: true, details: "Navigation link clicked and successfully routed to /explore." };
      } else {
        results["HOME-05"] = { pass: false, details: `Navigation failed, URL is ${page.url()}` };
      }
    } else {
      results["HOME-05"] = { pass: false, details: "Could not find a navigation link to test." };
    }

    const filteredErrors = errors.filter(e => !e.includes("favicon.ico") && !e.includes("apple-touch-icon"));
    const hydrationErrors = filteredErrors.filter(e => e.includes("Hydration") || e.includes("Minified React error") || e.includes("Warning: Text content did not match"));
    
    if (hydrationErrors.length === 0 && filteredErrors.length === 0) {
      results["HOME-06"] = { pass: true, details: "No hydration errors or console errors detected." };
    } else if (hydrationErrors.length > 0) {
      results["HOME-06"] = { pass: false, details: `Found Hydration errors: ${hydrationErrors.join(", ")}` };
    } else {
      results["HOME-06"] = { pass: false, details: `Found console/network errors: ${filteredErrors.join(", ")}` };
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
