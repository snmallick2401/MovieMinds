import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isUnauthorized } from "@/lib/auth/server";
import { ReactionType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId: targetId } = await params;
    const user = await requireUser();

    const body = await request.json().catch(() => ({}));
    const rawType = body?.type || "LIKE";
    const type = Object.values(ReactionType).includes(rawType)
      ? (rawType as ReactionType)
      : ReactionType.LIKE;

    // 1. Check if targetId is a DiscussionPost
    const post = await prisma.discussionPost.findUnique({
      where: { id: targetId },
      select: { id: true, userId: true },
    });

    if (post) {
      // Check if reaction already existed
      const existingReaction = await prisma.discussionReaction.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: targetId,
          },
        },
      });

      await prisma.discussionReaction.upsert({
        where: {
          userId_postId: {
            userId: user.id,
            postId: targetId,
          },
        },
        update: {
          reactionType: type,
        },
        create: {
          userId: user.id,
          postId: targetId,
          reactionType: type,
        },
      });

      const reactionCount = await prisma.discussionReaction.count({
        where: { postId: targetId },
      });

      await prisma.discussionPost.update({
        where: { id: targetId },
        data: { reactionCount },
      });

      // Grant reputation if newly reacted and author is someone else
      if (!existingReaction && post.userId !== user.id) {
        await prisma.user.update({
          where: { id: post.userId },
          data: { reputationScore: { increment: 1 } },
        });
      }

      return NextResponse.json({ success: true, reactionCount });
    }

    // 2. Check if targetId is a DiscussionThread
    const thread = await prisma.discussionThread.findUnique({
      where: { id: targetId },
      select: { id: true, userId: true },
    });

    if (thread) {
      const existingReaction = await prisma.discussionReaction.findUnique({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId: targetId,
          },
        },
      });

      await prisma.discussionReaction.upsert({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId: targetId,
          },
        },
        update: {
          reactionType: type,
        },
        create: {
          userId: user.id,
          threadId: targetId,
          reactionType: type,
        },
      });

      const reactionCount = await prisma.discussionReaction.count({
        where: { threadId: targetId },
      });

      await prisma.discussionThread.update({
        where: { id: targetId },
        data: { reactionCount },
      });

      // Grant reputation if newly reacted and author is someone else
      if (!existingReaction && thread.userId !== user.id) {
        await prisma.user.update({
          where: { id: thread.userId },
          data: { reputationScore: { increment: 1 } },
        });
      }

      return NextResponse.json({ success: true, reactionCount });
    }

    return NextResponse.json({ error: "Post or thread not found" }, { status: 404 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("React error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId: targetId } = await params;
    const user = await requireUser();

    // 1. Check if targetId is a DiscussionPost
    const post = await prisma.discussionPost.findUnique({
      where: { id: targetId },
      select: { id: true, userId: true },
    });

    if (post) {
      const existingReaction = await prisma.discussionReaction.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: targetId,
          },
        },
      });

      if (existingReaction) {
        await prisma.discussionReaction.delete({
          where: {
            userId_postId: {
              userId: user.id,
              postId: targetId,
            },
          },
        });

        // Deduct reputation from author if not reacting to own post
        if (post.userId !== user.id) {
          await prisma.user.update({
            where: { id: post.userId },
            data: { reputationScore: { decrement: 1 } },
          });
        }
      }

      const reactionCount = await prisma.discussionReaction.count({
        where: { postId: targetId },
      });

      await prisma.discussionPost.update({
        where: { id: targetId },
        data: { reactionCount },
      });

      return NextResponse.json({ success: true, reactionCount });
    }

    // 2. Check if targetId is a DiscussionThread
    const thread = await prisma.discussionThread.findUnique({
      where: { id: targetId },
      select: { id: true, userId: true },
    });

    if (thread) {
      const existingReaction = await prisma.discussionReaction.findUnique({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId: targetId,
          },
        },
      });

      if (existingReaction) {
        await prisma.discussionReaction.delete({
          where: {
            userId_threadId: {
              userId: user.id,
              threadId: targetId,
            },
          },
        });

        // Deduct reputation from author if not reacting to own thread
        if (thread.userId !== user.id) {
          await prisma.user.update({
            where: { id: thread.userId },
            data: { reputationScore: { decrement: 1 } },
          });
        }
      }

      const reactionCount = await prisma.discussionReaction.count({
        where: { threadId: targetId },
      });

      await prisma.discussionThread.update({
        where: { id: targetId },
        data: { reactionCount },
      });

      return NextResponse.json({ success: true, reactionCount });
    }

    return NextResponse.json({ error: "Post or thread not found" }, { status: 404 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Remove react error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
