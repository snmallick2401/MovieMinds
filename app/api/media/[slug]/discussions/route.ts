import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { findMediaBySlugOrId } from "@/lib/media/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: slugOrId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await findMediaBySlugOrId(slugOrId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    const mediaId = media.id;

    const { title, body, spoiler } = await request.json();
    
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    // 1. Create the thread
    const thread = await prisma.discussionThread.create({
      data: {
        mediaId,
        userId: user.id,
        title,
        body,
        spoiler: !!spoiler,
      },
    });

    // 2. Grant +2 Reputation to user
    await prisma.user.update({
      where: { id: user.id },
      data: { reputationScore: { increment: 2 } },
    });

    return NextResponse.json({ success: true, thread });
  } catch (error) {
    console.error("Create thread error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
