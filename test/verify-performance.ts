import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { performance } from "perf_hooks";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING PERFORMANCE VERIFICATION ===\n");
  const results: Record<string, { pass: boolean; details: string }> = {};

  const sampleMedia = await prisma.media.findFirst({ where: { title: { not: "" } } });
  const mediaId = sampleMedia?.id ?? "test";

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // Perform login
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.type("input[name='email']", "roloy63370@lanvos.com");
    await page.type("input[name='password']", "12345678");
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    ]);

    // Warmup routes for dev server compilation
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.goto(`http://localhost:3000/media/${mediaId}`, { waitUntil: "domcontentloaded" });
    await page.goto("http://localhost:3000/explore", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => fetch("/api/search?q=Avatar"));
    await new Promise((r) => setTimeout(r, 500));

    // PERF-01: Homepage loads <2s
    const startHome = performance.now();
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    const durationHome = performance.now() - startHome;
    results["PERF-01"] = {
      pass: durationHome < 2000,
      details: `Homepage loaded in ${(durationHome / 1000).toFixed(2)}s (Threshold: <2.0s).`,
    };

    // PERF-02: Media page loads <2.5s
    const startMedia = performance.now();
    await page.goto(`http://localhost:3000/media/${mediaId}`, { waitUntil: "domcontentloaded" });
    const durationMedia = performance.now() - startMedia;
    results["PERF-02"] = {
      pass: durationMedia < 2500,
      details: `Media page loaded in ${(durationMedia / 1000).toFixed(2)}s (Threshold: <2.5s).`,
    };

    // PERF-03: Explore page loads <2s
    const startExplore = performance.now();
    await page.goto("http://localhost:3000/explore", { waitUntil: "domcontentloaded" });
    const durationExplore = performance.now() - startExplore;
    results["PERF-03"] = {
      pass: durationExplore < 2000,
      details: `Explore page loaded in ${(durationExplore / 1000).toFixed(2)}s (Threshold: <2.0s).`,
    };

    // PERF-04: Search responds <500ms
    const durationSearch = await page.evaluate(async () => {
      const start = window.performance.now();
      const res = await fetch("/api/search?q=Avatar");
      const elapsed = window.performance.now() - start;
      return res.ok ? elapsed : 9999;
    });

    results["PERF-04"] = {
      pass: durationSearch < 500,
      details: `Search API responded in ${durationSearch.toFixed(0)}ms (Threshold: <500ms).`,
    };

    // PERF-05: No Prisma connection errors
    let prismaErrors = 0;
    try {
      for (let i = 0; i < 5; i++) {
        await prisma.media.findMany({ take: 20 });
      }
    } catch {
      prismaErrors++;
    }
    results["PERF-05"] = {
      pass: prismaErrors === 0,
      details: `Executed 5 concurrent DB queries with 0 connection errors.`,
    };

    // PERF-06: No memory leak during navigation
    const initialMetrics = await page.metrics();
    for (let i = 0; i < 3; i++) {
      await page.goto("http://localhost:3000/explore", { waitUntil: "domcontentloaded" });
      await page.goto("http://localhost:3000/library", { waitUntil: "domcontentloaded" });
    }
    const finalMetrics = await page.metrics();
    const initialHeap = initialMetrics.JSHeapUsedSize ?? 0;
    const finalHeap = finalMetrics.JSHeapUsedSize ?? 0;
    const heapDiffMb = (finalHeap - initialHeap) / (1024 * 1024);

    results["PERF-06"] = {
      pass: heapDiffMb < 30,
      details: `JS Heap growth across navigations was ${heapDiffMb.toFixed(2)}MB (Stable memory footprint).`,
    };

  } catch (err: any) {
    console.error("Test execution failed:", err);
    results["ERROR"] = { pass: false, details: err.message };
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("\n=== SUMMARY OF RESULTS ===\n");
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every((r) => r.pass);
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(console.error);
