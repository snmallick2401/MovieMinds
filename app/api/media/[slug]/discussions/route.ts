import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isUnauthorized } from "@/lib/auth/server";
import { findMediaBySlugOrId } from "@/lib/media/queries";
import { discussionThreadCreateSchema } from "@/lib/validations/discussions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: slugOrId } = await params;
    const user = await requireUser();

    const media = await findMediaBySlugOrId(slugOrId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    const mediaId = media.id;

    const json = await request.json().catch(() => null);
    const parsed = discussionThreadCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid discussion data." },
        { status: 400 }
      );
    }

    const { title, body, spoiler, category } = parsed.data;

    // 1. Create the thread
    const thread = await prisma.discussionThread.create({
      data: {
        mediaId,
        userId: user.id,
        title,
        body,
        category,
        spoiler,
      },
    });

    // 2. Grant +2 Reputation to user
    await prisma.user.update({
      where: { id: user.id },
      data: { reputationScore: { increment: 2 } },
    });

    return NextResponse.json({ success: true, thread }, { status: 201 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create thread error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
