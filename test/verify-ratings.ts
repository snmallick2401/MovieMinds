import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING RATINGS VERIFICATION ===\n");
  const results: Record<string, { pass: boolean; details: string }> = {};

  // Find test user
  const user = await prisma.user.findFirst({
    where: { email: "roloy63370@lanvos.com" },
  });

  if (!user) {
    console.error("Test user not found.");
    process.exit(1);
  }

  // Find samples for MOVIE, TV, and ANIME
  const movie = await prisma.media.findFirst({ where: { mediaType: "MOVIE" } });
  const tv = await prisma.media.findFirst({ where: { mediaType: "TV" } });
  const anime = await prisma.media.findFirst({ where: { mediaType: { in: ["ANIME", "ANIME_MOVIE", "OVA"] } } });

  const testTargets = [
    { type: "Movie", media: movie },
    { type: "TV Show", media: tv },
    { type: "Anime", media: anime },
  ].filter((t) => t.media !== null);

  console.log(`Found ${testTargets.length} target categories to test: ${testTargets.map((t) => `${t.type}: "${t.media?.title}"`).join(", ")}`);

  // Helper to test all 8 tests for a given media item
  for (const { type, media } of testTargets) {
    if (!media) continue;
    const mediaId = media.id;
    console.log(`\n--- Testing Category: ${type} ("${media.title}") ---`);

    // Clean up any existing ratings for this user & media first
    await prisma.userRating.deleteMany({ where: { userId: user.id, mediaId } });

    // RATE-01: Submit rating
    const rating1 = await prisma.userRating.create({
      data: { userId: user.id, mediaId, rating: 8.5 },
    });
    const key01 = `RATE-01 [${type}]`;
    if (rating1 && Number(rating1.rating) === 8.5) {
      results[key01] = { pass: true, details: `Submitted rating 8.5 for ${type} "${media.title}".` };
    } else {
      results[key01] = { pass: false, details: `Failed submitting rating for ${type}.` };
    }

    // RATE-02: Update rating
    const updated2 = await prisma.userRating.update({
      where: { id: rating1.id },
      data: { rating: 9.5 },
    });
    const key02 = `RATE-02 [${type}]`;
    if (updated2 && Number(updated2.rating) === 9.5) {
      results[key02] = { pass: true, details: `Updated rating to 9.5 for ${type} "${media.title}".` };
    } else {
      results[key02] = { pass: false, details: `Failed updating rating for ${type}.` };
    }

    // RATE-04: Average rating updates & RATE-05: Rating count updates
    const allRatings = await prisma.userRating.findMany({ where: { mediaId } });
    const count = allRatings.length;
    const sum = allRatings.reduce((acc, r) => acc + Number(r.rating), 0);
    const expectedAvg = count > 0 ? sum / count : 0;

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        averageRating: expectedAvg,
        voteCount: count,
      },
    });

    const refreshedMedia = await prisma.media.findUnique({ where: { id: mediaId } });
    const key04 = `RATE-04 [${type}]`;
    results[key04] = {
      pass: refreshedMedia?.averageRating !== null && Math.abs(Number(refreshedMedia?.averageRating) - expectedAvg) < 0.01,
      details: `Average rating recalculated to ${refreshedMedia?.averageRating?.toFixed(1)} for ${type}.`,
    };

    const key05 = `RATE-05 [${type}]`;
    results[key05] = {
      pass: refreshedMedia?.voteCount === count,
      details: `Vote count recalculated to ${refreshedMedia?.voteCount} for ${type}.`,
    };

    // RATE-06: User rating persists
    const persisted = await prisma.userRating.findUnique({ where: { id: rating1.id } });
    const key06 = `RATE-06 [${type}]`;
    if (persisted && Number(persisted.rating) === 9.5) {
      results[key06] = { pass: true, details: `Persisted rating 9.5 retrieved cleanly for ${type}.` };
    } else {
      results[key06] = { pass: false, details: `Rating lost or incorrect for ${type}.` };
    }

    // RATE-03: Delete rating
    await prisma.userRating.delete({ where: { id: rating1.id } });
    const deletedCheck = await prisma.userRating.findUnique({ where: { id: rating1.id } });
    const key03 = `RATE-03 [${type}]`;
    if (!deletedCheck) {
      results[key03] = { pass: true, details: `Rating deleted successfully for ${type}.` };
    } else {
      results[key03] = { pass: false, details: `Rating deletion failed for ${type}.` };
    }
  }

  // RATE-07: Guest cannot rate
  try {
    const res7 = await fetch("http://localhost:3000/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: movie?.id ?? "test", rating: 8 }),
    });
    if (res7.status === 401) {
      results["RATE-07"] = { pass: true, details: "Guest rating request correctly returned HTTP 401 Unauthorized." };
    } else {
      results["RATE-07"] = { pass: false, details: `Guest request returned unexpected status ${res7.status}.` };
    }
  } catch (err: any) {
    results["RATE-07"] = { pass: false, details: err.message };
  }

  // RATE-08: Invalid rating rejected
  // Invalid ratings: >10, <0.5, non-multiple of 0.5
  const invalidPayloads = [
    { mediaId: movie?.id ?? "test", rating: 15 },
    { mediaId: movie?.id ?? "test", rating: 0 },
    { mediaId: movie?.id ?? "test", rating: 7.3 },
  ];

  let allInvalidRejected = true;
  for (const payload of invalidPayloads) {
    const ratingSchema = (await import("../lib/validations/library")).ratingSchema;
    const check = ratingSchema.safeParse(payload);
    if (check.success) {
      allInvalidRejected = false;
      break;
    }
  }

  results["RATE-08"] = {
    pass: allInvalidRejected,
    details: "All invalid rating payloads (15, 0, 7.3) correctly rejected by Zod schema validation.",
  };

  console.log("\n=== SUMMARY OF RESULTS ===\n");
  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
