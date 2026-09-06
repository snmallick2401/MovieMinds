import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { recalculateMediaRating } from "@/lib/media/aggregates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logActivity, removeActivity } from "@/lib/activity/tracking";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { rating } = (await request.json()) as { rating: number };
    if (typeof rating !== "number" || rating < 0.5 || rating > 7 || (rating * 2) % 1 !== 0) return NextResponse.json({ error: "Invalid rating." }, { status: 400 });
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userRating.findUnique({ where: { id } });
      if (!existing || existing.userId !== user.id) return null;
      const updated = await tx.userRating.update({ where: { id }, data: { rating: new Prisma.Decimal(rating.toFixed(1)) } });
      const summary = await recalculateMediaRating(existing.mediaId, tx);
      return { rating: updated, summary };
    });
    if (!result) return NextResponse.json({ error: "Rating not found." }, { status: 404 });
    
    await logActivity({
      userId: user.id,
      mediaId: result.rating.mediaId,
      type: "RATED",
      ratingId: result.rating.id,
    });

    revalidateTag(`user-stats-${user.id}`);
    revalidateTag("user-stats");
    revalidateTag("user-stats-v7");
    
    return NextResponse.json({ rating: { id: result.rating.id, rating: Number(result.rating.rating), mediaId: result.rating.mediaId }, summary: { communityAverageRating: result.summary.communityAverageRating ? Number(result.summary.communityAverageRating) : null, weightedRating: result.summary.weightedRating ? Number(result.summary.weightedRating) : null, ratingCount: result.summary.ratingCount, popularityScore: result.summary.popularityScore, ratingDistribution: result.summary.ratingDistribution } });
  } catch { return NextResponse.json({ error: "Could not update rating." }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userRating.findUnique({ where: { id } });
      if (!existing || existing.userId !== user.id) return null;
      await tx.userRating.delete({ where: { id } });
      const summary = await recalculateMediaRating(existing.mediaId, tx);
      return { summary, mediaId: existing.mediaId };
    });
    if (!result)
      return NextResponse.json({ error: "Rating not found." }, { status: 404 });
      
    await removeActivity(user.id, result.mediaId, "RATED");

    revalidateTag(`user-stats-${user.id}`);
    revalidateTag("user-stats");
    revalidateTag("user-stats-v7");

    return NextResponse.json({ summary: { communityAverageRating: result.summary.communityAverageRating ? Number(result.summary.communityAverageRating) : null, weightedRating: result.summary.weightedRating ? Number(result.summary.weightedRating) : null, ratingCount: result.summary.ratingCount, popularityScore: result.summary.popularityScore, ratingDistribution: result.summary.ratingDistribution } });
  } catch {
    return NextResponse.json({ error: "Could not remove rating." }, { status: 500 });
  }
}

export const PATCH = PUT;
