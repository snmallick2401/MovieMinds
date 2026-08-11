import pino from "pino";

// Configure pino for Next.js environments
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
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
  // Add base bindings for all logs (e.g., app name, environment)
  base: {
    env: process.env.NODE_ENV,
  },
  // Ensure Next.js doesn't break when logging in Edge runtimes
  browser: {
    asObject: true,
  },
});
