import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();
    if (!type) return NextResponse.json({ error: "Type is required" }, { status: 400 });

    // Upsert the reaction
    await prisma.discussionReaction.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        }
      },
      update: {
        reactionType: type as any,
      },
      create: {
        userId: user.id,
        postId,
        reactionType: type as any,
      }
    });

    // Update the post's total reaction count
    const reactionCount = await prisma.discussionReaction.count({ where: { postId } });
    await prisma.discussionPost.update({
      where: { id: postId },
      data: { reactionCount }
    });
    
    // Also give +1 rep to the post author if this was a new reaction (for simplicity, we'll just increment it here but normally you'd check if it was newly created vs updated)

    return NextResponse.json({ success: true, reactionCount });
  } catch (error) {
    console.error("React error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.discussionReaction.delete({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        }
      }
    }).catch(() => {}); // Ignore if doesn't exist

    // Update the post's total reaction count
    const reactionCount = await prisma.discussionReaction.count({ where: { postId } });
    await prisma.discussionPost.update({
      where: { id: postId },
      data: { reactionCount }
    });

    return NextResponse.json({ success: true, reactionCount });
  } catch (error) {
    console.error("Remove react error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
