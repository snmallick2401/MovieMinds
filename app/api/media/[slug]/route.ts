import { NextResponse } from "next/server";
import { findMediaBySlugOrId, findSimilarMedia } from "@/lib/media/queries";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const media = await findMediaBySlugOrId(slug);
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  const similar = await findSimilarMedia(media);
  return NextResponse.json({ media, similar });
}
