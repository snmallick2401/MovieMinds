import { NextResponse } from "next/server";
import { getRatingDistribution } from "@/lib/media/aggregates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const [media, currentUserRating] = await Promise.all([
    prisma.media.findUnique({ where: { id }, select: { communityAverageRating: true, weightedRating: true, ratingCount: true, popularityScore: true, ratingDistribution: true } }),
    user ? prisma.userRating.findUnique({ where: { userId_mediaId: { userId: user.id, mediaId: id } }, select: { id: true, rating: true } }) : null,
  ]);
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  return NextResponse.json({ communityAverageRating: media.communityAverageRating ? Number(media.communityAverageRating) : null, weightedRating: media.weightedRating ? Number(media.weightedRating) : null, ratingCount: media.ratingCount, popularityScore: media.popularityScore, ratingDistribution: media.ratingDistribution, currentUserRating: currentUserRating ? { id: currentUserRating.id, rating: Number(currentUserRating.rating) } : null });
}
