import { PrismaClient, Prisma } from "@prisma/client";
import { generateSlugCandidates } from "../lib/utils/slug";

const prisma = new PrismaClient();
const BATCH_SIZE = 50;
const TX_TIMEOUT_MS = 20000; // 20s safety limit per transaction batch

// ==========================================
// Structured Logger with ANSI Formatting
// ==========================================
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  clearLine: "\x1b[K",
};

const logger = {
  timestamp: () => `${colors.dim}[${new Date().toLocaleTimeString()}]${colors.reset}`,

  info: (msg: string) => {
    console.log(`${logger.timestamp()} ${colors.cyan}ℹ${colors.reset}  ${msg}`);
  },

  success: (msg: string) => {
    console.log(`${logger.timestamp()} ${colors.green}✔${colors.reset}  ${msg}`);
  },

  warn: (msg: string) => {
    console.warn(`${logger.timestamp()} ${colors.yellow}⚠${colors.reset}  ${msg}`);
  },

  error: (msg: string, err?: unknown) => {
    console.error(`\n${logger.timestamp()} ${colors.red}✖  ${msg}${colors.reset}`);
    if (err) console.error(err);
  },

  step: (current: number, total: number, title: string) => {
    console.log(
      `\n${colors.bold}${colors.magenta}[${current}/${total}]${colors.reset} ${colors.bold}${title}${colors.reset}`
    );
  },

  progress: (chunkIndex: number, totalChunks: number, processed: number, total: number) => {
    const percent = Math.round((processed / total) * 100);
    const barLength = 20;
    const filledLength = Math.round((percent / 100) * barLength);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

    process.stdout.write(
      `\r${logger.timestamp()} ${colors.dim}[Batch ${chunkIndex + 1}/${totalChunks}]${colors.reset} [${bar}] ${percent}% (${processed}/${total})${colors.clearLine}`
    );

    if (processed === total) {
      process.stdout.write("\n");
    }
  },
};

// ==========================================
// Metrics Tracking
// ==========================================
interface BackfillMetrics {
  slugs: { evaluated: number; updated: number; collisionsResolved: number; durationMs: number };
  userRatings: { evaluated: number; updated: number; durationMs: number };
  mediaAverages: { evaluated: number; updated: number; durationMs: number };
}

const metrics: BackfillMetrics = {
  slugs: { evaluated: 0, updated: 0, collisionsResolved: 0, durationMs: 0 },
  userRatings: { evaluated: 0, updated: 0, durationMs: 0 },
  mediaAverages: { evaluated: 0, updated: 0, durationMs: 0 },
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function scaleUserRating(value: number): number {
  const scaled = (value / 10) * 7;
  const rounded = Math.round(scaled * 2) / 2;
  return Math.max(0.5, Math.min(7, rounded));
}

function scaleAverageRating(value: number): number {
  return Number(((value / 10) * 7).toFixed(2));
}

// ==========================================
// Migration Check
// ==========================================
async function detectUnmigratedData(): Promise<{ hasUnmigratedUserRatings: boolean; hasUnmigratedAverages: boolean }> {
  const [unmigratedUserRating, unmigratedMedia] = await Promise.all([
    prisma.userRating.findFirst({
      where: { rating: { gt: 7 } },
      select: { id: true },
    }),
    prisma.media.findFirst({
      where: {
        OR: [
          { averageRating: { gt: 7 } },
          { communityAverageRating: { gt: 7 } },
          { weightedRating: { gt: 7 } },
        ],
      },
      select: { id: true },
    }),
  ]);

  return {
    hasUnmigratedUserRatings: unmigratedUserRating !== null,
    hasUnmigratedAverages: unmigratedMedia !== null,
  };
}

// ==========================================
// Backfill Tasks
// ==========================================
async function backfillSlugs() {
  const start = Date.now();
  logger.step(1, 3, "Backfilling Media Slugs");

  logger.info("Scanning for media records with missing or empty slugs...");
  const missingMedia = await prisma.media.findMany({
    where: {
      OR: [{ slug: null }, { slug: "" }],
    },
    select: { id: true, title: true, year: true, sourceId: true },
  });

  metrics.slugs.evaluated = missingMedia.length;

  if (missingMedia.length === 0) {
    logger.success("No media missing slugs. Skipping step.");
    metrics.slugs.durationMs = Date.now() - start;
    return;
  }

  logger.info(`Found ${missingMedia.length} missing slug records. Loading existing slugs for collision checks...`);

  const existingRecords = await prisma.media.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });

  const takenSlugs = new Set<string>(existingRecords.map((m) => m.slug!).filter(Boolean));
  const updates: Array<{ id: string; slug: string }> = [];

  for (const media of missingMedia) {
    const candidates = generateSlugCandidates(media.title, media.year, media.sourceId);
    let chosenSlug = "";

    for (const candidate of candidates) {
      if (!takenSlugs.has(candidate)) {
        chosenSlug = candidate;
        break;
      }
    }

    if (!chosenSlug) {
      metrics.slugs.collisionsResolved++;
      const base = candidates[0] || `media-${media.id}`;
      let counter = 1;
      while (takenSlugs.has(`${base}-${counter}`)) {
        counter++;
      }
      chosenSlug = `${base}-${counter}`;
    }

    takenSlugs.add(chosenSlug);
    updates.push({ id: media.id as string, slug: chosenSlug });
  }

  logger.info(`Persisting ${updates.length} slugs across transactions (Batch Size: ${BATCH_SIZE})...`);

  const chunks = chunkArray(updates, BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < chunks.length; i++) {
    await prisma.$transaction(
      chunks[i].map((item) =>
        prisma.media.update({
          where: { id: item.id as any },
          data: { slug: item.slug },
        })
      )
    );
    processed += chunks[i].length;
    logger.progress(i, chunks.length, processed, updates.length);
  }

  metrics.slugs.updated = updates.length;
  metrics.slugs.durationMs = Date.now() - start;
  logger.success(`Slugs processed: ${updates.length} assigned (${metrics.slugs.collisionsResolved} collisions resolved) in ${metrics.slugs.durationMs}ms`);
}

async function backfillUserRatings() {
  const start = Date.now();
  logger.step(2, 3, "Scaling User Ratings (/10 -> /7)");

  logger.info("Scanning for user ratings to scale...");
  const userRatings = await prisma.userRating.findMany({
    select: { id: true, rating: true },
  });

  metrics.userRatings.evaluated = userRatings.length;

  if (userRatings.length === 0) {
    logger.success("No user ratings found. Skipping step.");
    metrics.userRatings.durationMs = Date.now() - start;
    return;
  }

  const updates = userRatings
    .filter((ur) => ur.rating !== null && ur.rating !== undefined)
    .map((ur) => ({
      id: ur.id,
      rating: scaleUserRating(Number(ur.rating)),
    }));

  logger.info(`Persisting ${updates.length} rating updates...`);

  const chunks = chunkArray(updates, BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < chunks.length; i++) {
    await prisma.$transaction(
      chunks[i].map((item) =>
        prisma.userRating.update({
          where: { id: item.id as any },
          data: { rating: item.rating },
        })
      )
    );
    processed += chunks[i].length;
    logger.progress(i, chunks.length, processed, updates.length);
  }

  metrics.userRatings.updated = updates.length;
  metrics.userRatings.durationMs = Date.now() - start;
  logger.success(`User ratings processed: ${updates.length} converted in ${metrics.userRatings.durationMs}ms`);
}

async function backfillMediaAverages() {
  const start = Date.now();
  logger.step(3, 3, "Scaling Media Averages (/10 -> /7)");

  logger.info("Scanning for media averages to scale...");
  const mediaToUpdate = await prisma.media.findMany({
    where: {
      OR: [
        { averageRating: { not: null } },
        { communityAverageRating: { not: null } },
        { weightedRating: { not: null } },
      ],
    },
    select: {
      id: true,
      averageRating: true,
      communityAverageRating: true,
      weightedRating: true,
    },
  });

  metrics.mediaAverages.evaluated = mediaToUpdate.length;

  if (mediaToUpdate.length === 0) {
    logger.success("No media averages found. Skipping step.");
    metrics.mediaAverages.durationMs = Date.now() - start;
    return;
  }

  const operations: Array<{ id: string; data: Prisma.MediaUpdateInput }> = [];

  for (const media of mediaToUpdate) {
    const data: Prisma.MediaUpdateInput = {};

    if (media.averageRating !== null && media.averageRating !== undefined) {
      data.averageRating = scaleAverageRating(Number(media.averageRating));
    }
    if (media.communityAverageRating !== null && media.communityAverageRating !== undefined) {
      data.communityAverageRating = scaleAverageRating(Number(media.communityAverageRating));
    }
    if (media.weightedRating !== null && media.weightedRating !== undefined) {
      data.weightedRating = scaleAverageRating(Number(media.weightedRating));
    }

    if (Object.keys(data).length > 0) {
      operations.push({ id: media.id as string, data });
    }
  }

  logger.info(`Persisting updates across ${operations.length} media records...`);

  const chunks = chunkArray(operations, BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < chunks.length; i++) {
    await prisma.$transaction(
      chunks[i].map((op) =>
        prisma.media.update({
          where: { id: op.id as any },
          data: op.data,
        })
      )
    );
    processed += chunks[i].length;
    logger.progress(i, chunks.length, processed, operations.length);
  }

  metrics.mediaAverages.updated = operations.length;
  metrics.mediaAverages.durationMs = Date.now() - start;
  logger.success(`Media averages processed: ${operations.length} rows updated in ${metrics.mediaAverages.durationMs}ms`);
}

function printSummary(totalDurationSec: string) {
  console.log(`\n${colors.bold}${colors.cyan}══════════════════ Backfill Execution Summary ══════════════════${colors.reset}`);
  console.table({
    "Slugs Backfilled": {
      Evaluated: metrics.slugs.evaluated,
      Updated: metrics.slugs.updated,
      Collisions: metrics.slugs.collisionsResolved,
      Duration: `${(metrics.slugs.durationMs / 1000).toFixed(2)}s`,
    },
    "User Ratings": {
      Evaluated: metrics.userRatings.evaluated,
      Updated: metrics.userRatings.updated,
      Collisions: 0,
      Duration: `${(metrics.userRatings.durationMs / 1000).toFixed(2)}s`,
    },
    "Media Averages": {
      Evaluated: metrics.mediaAverages.evaluated,
      Updated: metrics.mediaAverages.updated,
      Collisions: 0,
      Duration: `${(metrics.mediaAverages.durationMs / 1000).toFixed(2)}s`,
    },
  });
  console.log(`${colors.bold}${colors.green}Total Runtime: ${totalDurationSec}s${colors.reset}\n`);
}

async function main() {
  const globalStart = Date.now();
  logger.info("Initializing backfill process...");

  await backfillSlugs();

  logger.info("Checking database state for unmigrated > 7.0 rating values...");
  const { hasUnmigratedUserRatings, hasUnmigratedAverages } = await detectUnmigratedData();

  if (!hasUnmigratedUserRatings && !hasUnmigratedAverages) {
    logger.warn("No rating values > 7.0 detected across UserRating and Media tables. Skipping rating conversions to prevent accidental re-scaling.");
  } else {
    if (hasUnmigratedUserRatings) {
      await backfillUserRatings();
    } else {
      logger.warn("No user ratings > 7.0 detected. Skipping UserRating table.");
    }

    if (hasUnmigratedAverages) {
      await backfillMediaAverages();
    } else {
      logger.warn("No media averages > 7.0 detected. Skipping Media averages table.");
    }
  }

  const totalDuration = ((Date.now() - globalStart) / 1000).toFixed(2);
  printSummary(totalDuration);
}

main()
  .catch((e) => {
    logger.error("Migration encountered a fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
