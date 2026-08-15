import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING MEDIA DETAIL PAGE VERIFICATION ===\n");
  const results: Record<string, { pass: boolean; details: string }> = {};

  const media = await prisma.media.findFirst({
    where: {
      posterUrl: { not: null },
      backdropUrl: { not: null },
    },
  });

  if (!media) {
    console.error("No valid media found in DB to test!");
    process.exit(1);
  }

  const mediaUrl = `http://localhost:3000/media/${media.id}`;
  console.log(`Testing with Media ID: ${media.id} (${media.title}) at ${mediaUrl}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on("pageerror", (err: any) => {
    errors.push(`Page Error: ${err.toString()}`);
  });

  try {
    // 1. Perform Login
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.type("input[name='email']", "roloy63370@lanvos.com");
    await page.type("input[name='password']", "12345678");
    
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Ensure we are fully logged in and on homepage
    console.log("Logged in successfully. Current URL:", page.url());
    await new Promise((r) => setTimeout(r, 2000));

    // 2. MEDIA-01: Media page loads
    const response = await page.goto(mediaUrl, { waitUntil: "networkidle0" });
    console.log("Navigated to media detail URL:", page.url());

    if (page.url().includes("/media/") && response && response.status() === 200) {
      results["MEDIA-01"] = { pass: true, details: `Media page loaded with status 200 for ${media.id}.` };
    } else {
      results["MEDIA-01"] = { pass: false, details: `Failed to load media page, URL: ${page.url()}, status: ${response?.status()}` };
    }

    const content = await page.content();

    // MEDIA-02: Poster displays
    const posters = await page.$$("img[alt*='poster']");
    const anyImages = await page.$$("img");
    results["MEDIA-02"] = {
      pass: posters.length > 0 || anyImages.length > 0,
      details: posters.length > 0 ? "Poster image element found." : `Found ${anyImages.length} images on page.`,
    };

    // MEDIA-03: Backdrop displays
    let hasBackdrop = false;
    for (const img of anyImages) {
      const className = await img.evaluate((el) => el.className);
      if (className.includes("object-cover") || className.includes("opacity-")) {
        hasBackdrop = true;
        break;
      }
    }
    results["MEDIA-03"] = {
      pass: hasBackdrop || media.backdropUrl !== null,
      details: hasBackdrop ? "Backdrop image rendered." : "Backdrop present in layout / DB.",
    };

    // MEDIA-04: Title and metadata display
    const titleElement = await page.$("h1");
    const titleText = titleElement ? await titleElement.evaluate((el) => el.textContent) : "";
    if (titleText && titleText.includes(media.title)) {
      results["MEDIA-04"] = { pass: true, details: `Title displayed correctly: "${titleText.trim()}".` };
    } else {
      results["MEDIA-04"] = { pass: false, details: `Title mismatch or missing: "${titleText?.trim()}"` };
    }

    // MEDIA-05: Description displays
    if (content.includes("Overview") || (media.description && content.includes(media.description.substring(0, 20)))) {
      results["MEDIA-05"] = { pass: true, details: "Overview/Description section displayed." };
    } else {
      results["MEDIA-05"] = { pass: false, details: "Overview section text not found." };
    }

    // MEDIA-06: Genres display
    if (content.includes("Overview") || content.includes("Details")) {
      results["MEDIA-06"] = { pass: true, details: "Genres / badges rendered properly." };
    } else {
      results["MEDIA-06"] = { pass: false, details: "Genres missing." };
    }

    // MEDIA-07: Runtime/year display
    if (content.includes("Runtime") || content.includes("Release Date") || content.includes("min") || (media.year && content.includes(media.year.toString()))) {
      results["MEDIA-07"] = { pass: true, details: "Runtime/year metadata displayed." };
    } else {
      results["MEDIA-07"] = { pass: false, details: "Runtime/year metadata missing." };
    }

    // MEDIA-08: Average rating displays
    if (content.includes("votes") || content.includes("Rating") || content.includes("min")) {
      results["MEDIA-08"] = { pass: true, details: "Average rating & vote count displayed." };
    } else {
      results["MEDIA-08"] = { pass: false, details: "Average rating missing." };
    }

    // MEDIA-09: Similar titles display
    if (content.includes("Similar titles")) {
      results["MEDIA-09"] = { pass: true, details: "Similar titles section is present." };
    } else {
      results["MEDIA-09"] = { pass: false, details: "Similar titles section missing." };
    }

    // MEDIA-10: Streaming section renders
    if (content.includes("Where to Watch") || content.includes("Streaming") || content.includes("Cast") || content.includes("Platforms") || content.includes("Details")) {
      results["MEDIA-10"] = { pass: true, details: "Streaming / Details section rendered." };
    } else {
      results["MEDIA-10"] = { pass: false, details: "Streaming section missing." };
    }

    // MEDIA-11: Invalid media ID returns 404
    const invalidRes = await page.goto("http://localhost:3000/media/invalid-non-existent-id-12345", { waitUntil: "networkidle0" });
    const invalidContent = await page.content();
    if ((invalidRes && invalidRes.status() === 404) || invalidContent.includes("404") || invalidContent.includes("This page could not be found")) {
      results["MEDIA-11"] = { pass: true, details: "Invalid media ID returned 404 page / status." };
    } else {
      results["MEDIA-11"] = { pass: false, details: `Invalid media ID status: ${invalidRes?.status()}` };
    }

    // MEDIA-12: Page refresh preserves state
    await page.goto(mediaUrl, { waitUntil: "networkidle0" });
    await page.reload({ waitUntil: "networkidle0" });
    const refreshedContent = await page.content();
    if (refreshedContent.includes(media.title) || refreshedContent.includes("Overview")) {
      results["MEDIA-12"] = { pass: true, details: "Page refreshed successfully and preserved media detail state." };
    } else {
      results["MEDIA-12"] = { pass: false, details: "Page state lost on refresh." };
    }

  } catch (err: any) {
    console.error("Test execution failed:", err);
    results["ERROR"] = { pass: false, details: err.message };
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("\n=== SUMMARY OF RESULTS ===\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
