import { NextResponse, type NextRequest } from "next/server";
import { getMediaReviews } from "@/lib/reviews/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const result = await getMediaReviews(id, user?.id ?? null, page, 20);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}
