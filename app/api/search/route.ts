import { NextRequest, NextResponse } from "next/server";
import { findMedia } from "@/lib/media/queries";

const searchCache = new Map<string, { items: any[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache for search responses

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ items: [] });

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ items: cached.items });
  }

  const result = await findMedia({ query, pageSize: 10, sort: "popular" });
  searchCache.set(cacheKey, { items: result.items, timestamp: Date.now() });

  return NextResponse.json({ items: result.items });
}
