import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });

if (!globalForPrisma.prisma) {
  // @ts-expect-error - Prisma dynamically attaches these event emitters
  prisma.$on("query", (e: unknown) => {
    const event = e as { query: string; duration: number };
    if (event.duration > 500) {
      logger.warn({ msg: "Slow Prisma Query", query: event.query, duration: event.duration });
    } else {
      logger.debug({ msg: "Prisma Query", query: event.query, duration: event.duration });
    }
  });

  // @ts-expect-error - Prisma dynamically attaches these event emitters
  prisma.$on("error", (e: unknown) => {
    const event = e as { target: string; message: string };
    logger.error({ msg: "Prisma Error", target: event.target, message: event.message });
  });
  // @ts-expect-error - Prisma dynamically attaches these event emitters
  prisma.$on("info", (e: unknown) => {
    const event = e as { message: string };
    logger.info({ msg: "Prisma Info", message: event.message });
  });
  // @ts-expect-error - Prisma dynamically attaches these event emitters
  prisma.$on("warn", (e: unknown) => {
    const event = e as { message: string };
    logger.warn({ msg: "Prisma Warn", message: event.message });
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
