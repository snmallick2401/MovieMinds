import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isUnauthorized } from "@/lib/auth/server";
import { discussionReplyCreateSchema } from "@/lib/validations/discussions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const user = await requireUser();

    // Verify thread exists and is not locked
    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
      select: { id: true, locked: true },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.locked) {
      return NextResponse.json({ error: "This thread is locked for replies." }, { status: 403 });
    }

    const json = await request.json().catch(() => null);
    const parsed = discussionReplyCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid reply data." },
        { status: 400 }
      );
    }

    const { body, attachmentUrls } = parsed.data;

    // 1. Create the reply
    const post = await prisma.discussionPost.create({
      data: {
        threadId,
        userId: user.id,
        body,
        attachments: attachmentUrls?.length
          ? {
              create: attachmentUrls.map((url, index) => ({
                imageId: `attachment-${Date.now()}-${index}`,
                pageUrl: url,
                imageUrl: url,
                thumbUrl: url,
                sortOrder: index,
              })),
            }
          : undefined,
      },
    });

    // 2. Update thread reply count & updatedAt
    await prisma.discussionThread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // 3. Grant +1 Reputation to user
    await prisma.user.update({
      where: { id: user.id },
      data: { reputationScore: { increment: 1 } },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
