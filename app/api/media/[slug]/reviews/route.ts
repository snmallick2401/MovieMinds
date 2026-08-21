import { NextResponse, type NextRequest } from "next/server";
import { getMediaReviews } from "@/lib/reviews/queries";
import { createClient } from "@/lib/supabase/server";
import { findMediaBySlugOrId } from "@/lib/media/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: slugOrId } = await params;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const media = await findMediaBySlugOrId(slugOrId);
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  
  const result = await getMediaReviews(media.id, user?.id ?? null, page, 20);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}
