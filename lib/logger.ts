import pino, { type Logger } from "pino";

// Configure pino for Next.js environments
const isDevelopment = process.env.NODE_ENV === "development";

const globalForLogger = globalThis as unknown as { logger?: Logger };

export const logger =
  globalForLogger.logger ??
  pino({
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: [
        "email",
        "emailAddress",
        "email_address",
        "user_email",
        "user.email",
        "profile.email",
        "body.email",
        "body.password",
        "credentials.email",
        "credentials.password",
        "auth.email",
        "auth.password",
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "access_token",
        "refresh_token",
        "secret",
        "authorization",
        "cookie",
        "params",
        "DATABASE_URL",
        "DIRECT_URL",
        "CATALOG_SYNC_SECRET",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "headers.authorization",
        "headers.cookie",
        "req.headers.authorization",
        "req.headers.cookie",
        "*.email",
        "*.emailAddress",
        "*.email_address",
        "*.password",
        "*.token",
        "*.secret",
        "*.authorization",
        "*.cookie",
        "*.DATABASE_URL",
        "*.DIRECT_URL",
        "*.CATALOG_SYNC_SECRET",
        "*.params",
        "*.apiKey",
        "*.api_key",
        "*.sessionToken",
        "*.session_token",
      ],
      censor: "[REDACTED]",
    },
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

