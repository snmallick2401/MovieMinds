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

    await prisma.threadWatch.upsert({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId,
        }
      },
      update: {},
      create: {
        userId: user.id,
        threadId,
      }
    });

    return NextResponse.json({ success: true, watching: true });
  } catch (error) {
    console.error("Watch thread error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.threadWatch.delete({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId,
        }
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, watching: false });
  } catch (error) {
    console.error("Unwatch thread error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
