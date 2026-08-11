import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { getMediaReviews } from "@/lib/reviews/queries";
import { reviewUpdateSchema } from "@/lib/validations/library";
import { removeActivity } from "@/lib/activity/tracking";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([requireUser(), params]);
    const parsed = reviewUpdateSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    const result = await prisma.review.updateMany({
      where: { id, userId: user.id },
      data: {
        ...parsed.data,
        ...(parsed.data.title !== undefined ? { title: parsed.data.title || null } : {}),
        editedAt: new Date(),
      },
    });
    if (!result.count)
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    const updated = await prisma.review.findUniqueOrThrow({
      where: { id },
      select: { mediaId: true },
    });
    const reviews = await getMediaReviews(updated.mediaId, user.id);
    return NextResponse.json({ review: reviews.userReview });
  } catch {
    return NextResponse.json({ error: "Could not update review." }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([requireUser(), params]);
    const review = await prisma.review.findFirst({
      where: { id, userId: user.id },
      select: { mediaId: true },
    });
    if (!review)
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    await prisma.review.delete({ where: { id } });
    await removeActivity(user.id, review.mediaId, "REVIEWED");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Could not remove review." }, { status: 500 });
  }
}
