import { NextRequest, NextResponse } from "next/server";
import { findMedia } from "@/lib/media/queries";

const MAX_CACHE_ENTRIES = 200;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache for search responses
const searchCache = new Map<string, { items: any[]; timestamp: number }>();

function getFromCache(key: string) {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp >= CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }

  // Refresh LRU order: re-insert key at the end
  searchCache.delete(key);
  searchCache.set(key, cached);
  return cached.items;
}

function setInCache(key: string, items: any[]) {
  // Evict oldest entries if capacity reached
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) {
      searchCache.delete(oldestKey);
    }
  }

  searchCache.set(key, { items, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q")?.trim();
  if (!rawQuery) return NextResponse.json({ items: [] });

  // Limit search query length to 100 characters to prevent DoS via massive strings
  const query = rawQuery.slice(0, 100);
  const cacheKey = query.toLowerCase();

  const cachedItems = getFromCache(cacheKey);
  if (cachedItems) {
    return NextResponse.json(
      { items: cachedItems },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  }

  const result = await findMedia({ query, pageSize: 10, sort: "popular" });
  setInCache(cacheKey, result.items);

  return NextResponse.json(
    { items: result.items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
