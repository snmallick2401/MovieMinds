import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { isFollowRateLimited, validateFollowTarget } from "@/lib/validations/social";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isFollowRateLimited(user.id)) {
      logger.warn({ msg: "Follow rate limit exceeded", userId: user.id });
      return NextResponse.json(
        { error: "Too many follow requests. Please wait a moment." },
        { status: 429 },
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { targetUserId } = body ?? {};

    const targetCheck = validateFollowTarget(targetUserId, user.id);
    if (!targetCheck.valid) {
      return NextResponse.json({ error: targetCheck.error }, { status: targetCheck.status });
    }
    const cleanTargetUserId = targetCheck.targetUserId;

    // Verify target user actually exists in the database to prevent P2003 foreign key crash
    const targetUser = await prisma.user.findUnique({
      where: { id: cleanTargetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create follow record
      await tx.follow.create({
        data: {
          followerId: user.id,
          followingId: cleanTargetUserId,
        },
      });

      // 2. Create or deduplicate notification to prevent spamming notification feed
      const existingUnreadNotification = await tx.notification.findFirst({
        where: {
          userId: cleanTargetUserId,
          actorId: user.id,
          type: "NEW_FOLLOWER",
          read: false,
        },
      });

      if (existingUnreadNotification) {
        // Refresh timestamp of the existing unread notification without creating a new row
        await tx.notification.update({
          where: { id: existingUnreadNotification.id },
          data: { createdAt: new Date() },
        });
      } else {
        await tx.notification.create({
          data: {
            userId: cleanTargetUserId,
            actorId: user.id,
            type: "NEW_FOLLOWER",
          },
        });
      }

      // 3. Create or deduplicate activity
      const existingActivity = await tx.activity.findFirst({
        where: {
          userId: user.id,
          targetUserId: cleanTargetUserId,
          type: "FOLLOWED",
        },
      });

      if (existingActivity) {
        await tx.activity.update({
          where: { id: existingActivity.id },
          data: { createdAt: new Date() },
        });
      } else {
        await tx.activity.create({
          data: {
            userId: user.id,
            targetUserId: cleanTargetUserId,
            type: "FOLLOWED",
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Already following" }, { status: 400 });
    }
    if (error?.code === "P2003") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    logger.error({ msg: "Follow error", error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isFollowRateLimited(user.id)) {
      logger.warn({ msg: "Unfollow rate limit exceeded", userId: user.id });
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("targetUserId");

    const targetCheck = validateFollowTarget(targetUserId, user.id);
    if (!targetCheck.valid) {
      return NextResponse.json({ error: targetCheck.error }, { status: targetCheck.status });
    }
    const cleanTargetUserId = targetCheck.targetUserId;

    await prisma.$transaction(async (tx) => {
      // 1. Delete follow record
      await tx.follow.deleteMany({
        where: {
          followerId: user.id,
          followingId: cleanTargetUserId,
        },
      });

      // 2. Delete activity
      await tx.activity.deleteMany({
        where: {
          userId: user.id,
          targetUserId: cleanTargetUserId,
          type: "FOLLOWED",
        },
      });

      // 3. Clean up unread follower notifications to prevent ghost spam and flooding
      await tx.notification.deleteMany({
        where: {
          userId: cleanTargetUserId,
          actorId: user.id,
          type: "NEW_FOLLOWER",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ msg: "Unfollow error", error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
