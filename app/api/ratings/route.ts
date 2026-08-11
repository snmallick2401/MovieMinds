import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { recalculateMediaRating } from "@/lib/media/aggregates";
import { prisma } from "@/lib/prisma";
import { ratingSchema } from "@/lib/validations/library";
import { logActivity } from "@/lib/activity/tracking";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const page = Math.max(1, Number(new URL(request.url).searchParams.get("page")) || 1);
    const pageSize = 20;
    const [items, total] = await prisma.$transaction([
      prisma.userRating.findMany({ where: { userId: user.id }, include: { media: { select: { id: true, title: true, posterUrl: true, year: true, mediaType: true, communityAverageRating: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.userRating.count({ where: { userId: user.id } }),
    ]);
    return NextResponse.json({
      items: items.map((item) => ({ ...item, rating: Number(item.rating), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), media: { ...item.media, communityAverageRating: item.media.communityAverageRating ? Number(item.media.communityAverageRating) : null } })),
      page, pageSize, total, totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

import { refreshMedia } from "@/lib/media/sync";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = ratingSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    let targetMediaId = parsed.data.mediaId;
    let media = await prisma.media.findUnique({
      where: { id: targetMediaId },
      select: { id: true },
    });
    if (
      !media &&
      (targetMediaId.startsWith("tmdb-") || targetMediaId.startsWith("anilist-"))
    ) {
      const source = targetMediaId.startsWith("tmdb-") ? "TMDB" : "ANILIST";
      const sourceId = targetMediaId.replace(/^(tmdb-|anilist-)/, "");
      const record = await refreshMedia(source, sourceId, "MOVIE");
      media = { id: record.id };
      targetMediaId = record.id;
    }
    if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
    const rating = await prisma.$transaction(async (tx) => {
      const record = await tx.userRating.upsert({
        where: { userId_mediaId: { userId: user.id, mediaId: targetMediaId } },
        create: { userId: user.id, mediaId: targetMediaId, rating: parsed.data.rating },
        update: { rating: parsed.data.rating },
      });
      const summary = await recalculateMediaRating(targetMediaId, tx);
      return { record, summary };
    });

    await logActivity({
      userId: user.id,
      mediaId: targetMediaId,
      type: "RATED",
      rating: parsed.data.rating,
    });

    return NextResponse.json({ rating: { id: rating.record.id, mediaId: rating.record.mediaId, rating: Number(rating.record.rating), createdAt: rating.record.createdAt.toISOString(), updatedAt: rating.record.updatedAt.toISOString() }, summary: { communityAverageRating: rating.summary.communityAverageRating ? Number(rating.summary.communityAverageRating) : null, weightedRating: rating.summary.weightedRating ? Number(rating.summary.weightedRating) : null, ratingCount: rating.summary.ratingCount, popularityScore: rating.summary.popularityScore, ratingDistribution: rating.summary.ratingDistribution } });
  } catch {
    return NextResponse.json({ error: "Could not save rating." }, { status: 500 });
  }
}
