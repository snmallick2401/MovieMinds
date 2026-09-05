import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { syncCollection } from "@/lib/media/sync";

// Rate limiting to prevent brute force attacks on the sync endpoint
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_ATTEMPTS_PER_WINDOW = 30; // Max 30 attempts per minute per IP
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

  if (entry.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

/**
 * Constant-time comparison between two strings using SHA-256 hashing and crypto.timingSafeEqual.
 *
 * Comparing fixed-length 32-byte hashes ensures:
 * 1. Byte lengths are always identical (32 bytes), avoiding RangeError in timingSafeEqual.
 * 2. Character-by-character timing differences (side-channel timing attacks) are eliminated.
 * 3. Secret length is not leaked through short-circuit comparison.
 */
function constantTimeCompare(provided: string, expected: string): boolean {
  const hashProvided = crypto.createHash("sha256").update(provided).digest();
  const hashExpected = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

const syncPayloadSchema = z.object({
  collection: z.enum(["trending", "popular", "top_rated", "upcoming"]).default("trending"),
  page: z.number().int().min(1).max(500).default(1),
  source: z.enum(["all", "tmdb", "anilist"]).default("all"),
});

export async function POST(request: NextRequest) {
  // 1. Enforce Rate Limiting
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // 2. Validate Authorization Header in Constant Time
  const secret = process.env.CATALOG_SYNC_SECRET;
  const isSecretConfigured = typeof secret === "string" && secret.trim().length > 0;

  // Use a dummy constant if secret is not configured to maintain identical execution time
  const targetSecret = isSecretConfigured ? secret! : "dummy_unconfigured_secret_placeholder";
  const expectedHeader = `Bearer ${targetSecret}`;
  const authHeader = request.headers.get("authorization") ?? "";

  const isValid = constantTimeCompare(authHeader, expectedHeader);

  if (!isSecretConfigured || !isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Validate Request Payload
  const rawBody = await request.json().catch(() => ({}));
  const parsed = syncPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const { collection, page, source } = parsed.data;

  // 4. Execute Sync
  try {
    const result = await syncCollection(collection, page, source);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Catalog sync failed", error);
    return NextResponse.json(
      {
        error: "Catalog sync failed.",
        ...(process.env.NODE_ENV !== "production" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 502 }
    );
  }
}
