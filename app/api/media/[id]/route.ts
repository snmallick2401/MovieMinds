import { NextResponse } from "next/server";
import { findMediaById, findSimilarMedia } from "@/lib/media/queries";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await findMediaById(id);
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  const similar = await findSimilarMedia(media);
  return NextResponse.json({ media, similar });
}
