import { NextResponse, type NextRequest } from "next/server";
import { parseMediaFilters } from "@/lib/media/filters";
import { findMedia } from "@/lib/media/queries";

export async function GET(request: NextRequest) {
  const filters = parseMediaFilters(request.nextUrl.searchParams);
  const result = await findMedia(filters);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
  });
}
