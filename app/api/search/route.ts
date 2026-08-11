import { NextResponse, type NextRequest } from "next/server";
import { findMedia } from "@/lib/media/queries";
import { searchTmdb } from "@/lib/tmdb/client";
import { searchAniList } from "@/lib/anilist/client";
import { normalizedToSummary } from "@/lib/media/serializers";
import { autoPersistSearchResults } from "@/lib/media/expansion";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ items: [] });

  const [dbResult, tmdbResults, anilistResults] = await Promise.all([
    findMedia({ query, pageSize: 8, sort: "popular" }),
    searchTmdb(query),
    searchAniList(query),
  ]);

  const externalItems = [...tmdbResults, ...anilistResults];
  autoPersistSearchResults(externalItems).catch(() => {});

  const dbTitles = new Set(dbResult.items.map((i) => i.title.toLowerCase()));
  const externalSummaries = externalItems
    .filter((m) => !dbTitles.has(m.title.toLowerCase()))
    .map(normalizedToSummary);

  const merged = [...dbResult.items, ...externalSummaries].slice(0, 10);
  return NextResponse.json({ items: merged });
}
