import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/auth/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_LOGS_PER_WINDOW = 15; // Max 15 logs per minute per user/IP
const MAX_RATE_LIMIT_ENTRIES = 500;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldest = rateLimitMap.keys().next().value;
      if (oldest) rateLimitMap.delete(oldest);
    }
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_LOGS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

/**
 * Strips ANSI escapes, CRLF, and control characters to prevent log injection and log splitting.
 */
function sanitizeLogString(str: string, maxLength: number): string {
  return str
    // Strip ANSI escape sequences (e.g. \x1b[31m)
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "")
    // Replace CRLF / newlines / tabs with a single space
    .replace(/[\r\n\t]+/g, " ")
    // Strip control characters (0x00 - 0x1F, 0x7F - 0x9F)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Safely sanitizes context object to prevent prototype pollution and root field collisions.
 */
function sanitizeContext(rawContext: unknown): Record<string, string | number | boolean> {
  if (!rawContext || typeof rawContext !== "object" || Array.isArray(rawContext)) {
    return {};
  }

  const sanitized: Record<string, string | number | boolean> = {};
  const dangerousKeys = new Set([
    "__proto__",
    "constructor",
    "prototype",
    "time",
    "level",
    "pid",
    "hostname",
    "msg",
    "v",
  ]);

  const entries = Object.entries(rawContext as Record<string, unknown>).slice(0, 10);

  for (const [key, val] of entries) {
    const cleanKey = sanitizeLogString(key, 50);
    if (!cleanKey || dangerousKeys.has(cleanKey.toLowerCase())) {
      continue;
    }

    if (typeof val === "string") {
      sanitized[cleanKey] = sanitizeLogString(val, 200);
    } else if (typeof val === "number" && Number.isFinite(val)) {
      sanitized[cleanKey] = val;
    } else if (typeof val === "boolean") {
      sanitized[cleanKey] = val;
    }
  }

  return sanitized;
}

const clientLogSchema = z.object({
  level: z.enum(["info", "warn", "error"]).default("info"),
  message: z.string().trim().min(1, "Message cannot be empty").max(500, "Message too long"),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Enforce Authentication
    let user;
    try {
      user = await requireUser();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Enforce Rate Limiting
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateLimitKey = `${user.id}:${clientIp}`;

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many log requests. Please try again later." },
        { status: 429 }
      );
    }

    // 3. Validate Request Body
    const json = await request.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = clientLogSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid log data" },
        { status: 400 }
      );
    }

    const { level, message, context } = parsed.data;

    // 4. Sanitize Input against CRLF, ANSI escapes, and pollution
    const cleanMessage = sanitizeLogString(message, 500);
    const cleanContext = sanitizeContext(context);
    const userAgent = sanitizeLogString(request.headers.get("user-agent") ?? "unknown", 150);

    // 5. Structure Log Payload safely without polluting Pino root
    const safePayload = {
      source: "client",
      userId: user.id,
      clientIp,
      userAgent,
      clientContext: cleanContext,
    };

    const formattedMessage = `[ClientLog] ${cleanMessage}`;

    switch (level) {
      case "error":
        logger.error(safePayload, formattedMessage);
        break;
      case "warn":
        logger.warn(safePayload, formattedMessage);
        break;
      default:
        logger.info(safePayload, formattedMessage);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process client log", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
