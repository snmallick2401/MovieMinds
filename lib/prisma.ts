import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";
import { scrubSensitiveData } from "./security/credentials";

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
    const event = e as { query: string; params?: string; duration: number };
    const cleanQuery = scrubSensitiveData(event.query) as string;
    const cleanParams = event.params ? (scrubSensitiveData(event.params) as string) : undefined;
    if (event.duration > 1000) {
      logger.warn({ msg: "Slow Prisma Query", query: cleanQuery, params: cleanParams, duration: event.duration });
    } else {
      logger.debug({ msg: "Prisma Query", query: cleanQuery, params: cleanParams, duration: event.duration });
    }
  });

  // @ts-expect-error - Prisma dynamically attaches these event emitters
  prisma.$on("error", (e: unknown) => {
    const event = e as { target: string; message: string };
    logger.error({
      msg: "Prisma Error",
      target: event.target,
      message: scrubSensitiveData(event.message) as string,
    });
  });
  // @ts-expect-error - Prisma dynamically attaches these event emitters
  prisma.$on("info", (e: unknown) => {
    const event = e as { message: string };
    logger.info({ msg: "Prisma Info", message: scrubSensitiveData(event.message) as string });
  });
  // @ts-expect-error - Prisma dynamically attaches these event emitters
  prisma.$on("warn", (e: unknown) => {
    const event = e as { message: string };
    logger.warn({ msg: "Prisma Warn", message: scrubSensitiveData(event.message) as string });
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
