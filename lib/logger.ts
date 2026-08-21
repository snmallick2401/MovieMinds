import pino, { type Logger } from "pino";

// Configure pino for Next.js environments
const isDevelopment = process.env.NODE_ENV === "development";

const globalForLogger = globalThis as unknown as { logger?: Logger };

export const logger =
  globalForLogger.logger ??
  pino({
    level: process.env.LOG_LEVEL || "info",
    transport: isDevelopment
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        }
      : undefined,
    base: {
      env: process.env.NODE_ENV,
    },
    browser: {
      asObject: true,
    },
  });

if (process.env.NODE_ENV !== "production") globalForLogger.logger = logger;

