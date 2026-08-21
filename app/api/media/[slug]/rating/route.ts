import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { findMediaBySlugOrId } from "@/lib/media/queries";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: slugOrId } = await params;
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  
  const isCuid = /^c[a-z0-9]{24,}$/.test(slugOrId);
  const media = await prisma.media.findFirst({
    where: isCuid ? { id: slugOrId } : { slug: slugOrId },
    select: { id: true, communityAverageRating: true, weightedRating: true, ratingCount: true, popularityScore: true, ratingDistribution: true }
  });
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  
  const currentUserRating = user ? await prisma.userRating.findUnique({ where: { userId_mediaId: { userId: user.id, mediaId: media.id } }, select: { id: true, rating: true } }) : null;

  return NextResponse.json({ communityAverageRating: media.communityAverageRating, weightedRating: media.weightedRating, ratingCount: media.ratingCount, popularityScore: media.popularityScore, ratingDistribution: media.ratingDistribution, currentUserRating: currentUserRating ? { id: currentUserRating.id, rating: Number(currentUserRating.rating) } : null });
}
