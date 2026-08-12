import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { body } = await request.json();
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    // 1. Create the reply
    const post = await prisma.discussionPost.create({
      data: {
        threadId,
        userId: user.id,
        body,
      },
    });

    // 2. Update thread reply count & updatedAt
    await prisma.discussionThread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        updatedAt: new Date(),
      }
    });

    // 3. Grant +1 Reputation to user
    await prisma.user.update({
      where: { id: user.id },
      data: { reputationScore: { increment: 1 } },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Reply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
