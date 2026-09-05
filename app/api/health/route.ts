import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbOk = false;
  let dbLatencyMs = -1;
  let supabaseApiOk = false;
  let supabaseLatencyMs = -1;
  let errorDetail: string | null = null;

  // 1. Direct Prisma query to execute real SQL against Supabase PostgreSQL
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as alive`;
    dbLatencyMs = Date.now() - start;
    dbOk = true;
  } catch (err: unknown) {
    errorDetail = err instanceof Error ? err.message : String(err);
  }

  // 2. Direct Supabase PostgREST API query to register REST API activity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const start = Date.now();
      const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        cache: "no-store",
      });
      supabaseLatencyMs = Date.now() - start;
      supabaseApiOk = res.ok;
    } catch {
      supabaseApiOk = false;
    }
  }

  const status = dbOk ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp,
      checks: {
        database: {
          ok: dbOk,
          latencyMs: dbLatencyMs,
          error: errorDetail,
        },
        supabaseApi: {
          ok: supabaseApiOk,
          latencyMs: supabaseLatencyMs,
        },
      },
    },
    {
      status: dbOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

export async function HEAD() {
  return GET();
}
