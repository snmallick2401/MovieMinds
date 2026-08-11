import { NextResponse, type NextRequest } from "next/server";
import { syncCollection } from "@/lib/media/sync";

export async function POST(request: NextRequest) {
  const secret = process.env.CATALOG_SYNC_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    collection?: string;
    page?: number;
    source?: string;
  };
  const collection = ["trending", "popular", "top_rated", "upcoming"].includes(
    body.collection ?? "",
  )
    ? (body.collection as "trending" | "popular" | "top_rated" | "upcoming")
    : "trending";
  const page = Number.isInteger(body.page) && body.page! > 0 ? body.page! : 1;
  const source = ["all", "tmdb", "anilist"].includes(body.source ?? "")
    ? (body.source as "all" | "tmdb" | "anilist")
    : "all";
  try {
    return NextResponse.json(await syncCollection(collection, page, source));
  } catch (error) {
    console.error("Catalog sync failed", error);
    return NextResponse.json(
      {
        error: "Catalog sync failed.",
        ...(process.env.NODE_ENV !== "production" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 502 },
    );
  }
}
