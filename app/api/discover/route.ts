import { NextResponse, type NextRequest } from "next/server";
import { parseMediaFilters } from "@/lib/media/filters";
import { findMedia, getExploreSections } from "@/lib/media/queries";

export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get("section");
  if (section) {
    const sections = await getExploreSections();
    const items = sections[section as keyof typeof sections];
    if (!items)
      return NextResponse.json({ error: "Unknown discovery section." }, { status: 400 });
    return NextResponse.json({ items });
  }
  return NextResponse.json(
    await findMedia(parseMediaFilters(request.nextUrl.searchParams)),
  );
}
