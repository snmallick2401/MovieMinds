import { NextResponse } from "next/server";
import { requireUser, isUnauthorized } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { getMediaReviews } from "@/lib/reviews/queries";
import { reviewSchema } from "@/lib/validations/library";
import { logActivity } from "@/lib/activity/tracking";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    const media = await prisma.media.findUnique({
      where: { id: parsed.data.mediaId },
      select: { id: true },
    });
    if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
    const review = await prisma.review.upsert({
      where: { userId_mediaId: { userId: user.id, mediaId: parsed.data.mediaId } },
      create: { userId: user.id, ...parsed.data, title: parsed.data.title || null },
      update: { ...parsed.data, title: parsed.data.title || null, editedAt: new Date() },
    });
    await logActivity({
      userId: user.id,
      mediaId: parsed.data.mediaId,
      type: "REVIEWED",
      reviewId: review.id,
    });
    const reviews = await getMediaReviews(parsed.data.mediaId, user.id);
    return NextResponse.json({ review: reviews.userReview }, { status: 201 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Could not save review." }, { status: 500 });
  }
}
