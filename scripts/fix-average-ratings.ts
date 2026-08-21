import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 50;

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

  step: (title: string) => {
    console.log(`\n${colors.bold}${colors.magenta}▶ ${title}${colors.reset}`);
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
// Conversion & Batch Helpers
// ==========================================
function scaleToSeven(val: number): number {
  // Handles raw AniList scores (0-100) vs standard TMDB scores (0-10)
  if (val > 10) {
    return Number(((val / 100) * 7).toFixed(2));
  }
  return Number(((val / 10) * 7).toFixed(2));
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// ==========================================
// Main Execution
// ==========================================
async function fixAverageRatings() {
  const start = Date.now();
  logger.step("Fixing Media Average Ratings (> 7.0 -> /7 Scale)");

  logger.info("Scanning for media records with averageRating > 7.0...");
  const mediaRecords = await prisma.media.findMany({
    where: { averageRating: { gt: 7 } },
    select: { id: true, averageRating: true },
  });

  const total = mediaRecords.length;

  if (total === 0) {
    logger.success("No records found with averageRating > 7.0. Database is already clean.");
    return { evaluated: 0, updated: 0, durationMs: Date.now() - start };
  }

  logger.info(`Found ${total} records requiring adjustment. Persisting in batches of ${BATCH_SIZE}...`);

  const chunks = chunkArray(mediaRecords, BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < chunks.length; i++) {
    await Promise.all(
      chunks[i].map((media) =>
        prisma.media.update({
          where: { id: media.id },
          data: {
            averageRating: scaleToSeven(Number(media.averageRating)),
          },
        })
      )
    );

    processed += chunks[i].length;
    logger.progress(i, chunks.length, processed, total);
  }

  const durationMs = Date.now() - start;
  logger.success(`Processed ${processed} records in ${(durationMs / 1000).toFixed(2)}s.`);

  return { evaluated: total, updated: processed, durationMs };
}

function printSummary(stats: { evaluated: number; updated: number; durationMs: number }) {
  console.log(`\n${colors.bold}${colors.cyan}══════════════════ Fix Execution Summary ══════════════════${colors.reset}`);
  console.table({
    "Average Ratings Fixed": {
      Evaluated: stats.evaluated,
      Updated: stats.updated,
      Duration: `${(stats.durationMs / 1000).toFixed(2)}s`,
    },
  });
  console.log(`${colors.bold}${colors.green}Total Runtime: ${(stats.durationMs / 1000).toFixed(2)}s${colors.reset}\n`);
}

async function main() {
  logger.info("Starting average rating fix script...");
  const stats = await fixAverageRatings();
  printSummary(stats);
}

main()
  .catch((e) => {
    logger.error("Fix script encountered a fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
