import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { targetUserId } = body;
    
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }
    
    if (user.id === targetUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create follow
      await tx.follow.create({
        data: {
          followerId: user.id,
          followingId: targetUserId,
        },
      });

      // 2. Create notification
      await tx.notification.create({
        data: {
          userId: targetUserId,
          actorId: user.id,
          type: "NEW_FOLLOWER",
        },
      });

      // 3. Create activity
      await tx.activity.create({
        data: {
          userId: user.id,
          targetUserId: targetUserId,
          type: "FOLLOWED",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already following" }, { status: 400 });
    }
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("targetUserId");
    
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: targetUserId,
          },
        },
      });
      // Optionally delete the activity so it doesn't clutter the feed if they unfollow
      await tx.activity.deleteMany({
        where: {
          userId: user.id,
          targetUserId: targetUserId,
          type: "FOLLOWED",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
