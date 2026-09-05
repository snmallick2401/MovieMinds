import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Health check endpoint designed for uptime monitors (UptimeRobot, BetterUptime, Vercel Cron, GitHub Actions).
 * 
 * Performs two distinct checks to guarantee activity is registered with Supabase:
 * 1. Direct PostgreSQL query via Prisma ($queryRaw`SELECT 1`)
 * 2. Supabase PostgREST API request with API key
 * 
 * This ensures the 7-day inactivity pause on Supabase's free tier is permanently prevented.
 */
export async function GET() {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  let dbOk = false;
  let dbLatencyMs = -1;
  let supabaseApiOk = false;
  let errorDetail: string | null = null;

  // 1. Direct Prisma SQL query against Supabase PostgreSQL
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1 as keepalive`;
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (err: unknown) {
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  // 2. Direct Supabase PostgREST API query to register REST API activity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        cache: "no-store",
      });
      supabaseApiOk = res.ok;
    } catch {
      supabaseApiOk = false;
    }
  }

  const isHealthy = dbOk;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp,
      totalLatencyMs: Date.now() - start,
      database: {
        connected: dbOk,
        latencyMs: dbLatencyMs,
        error: errorDetail,
      },
      supabaseRestApi: {
        active: supabaseApiOk,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}

// Support HEAD requests from uptime monitors that use HEAD instead of GET
export async function HEAD() {
  return GET();
}
