import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile data." },
      { status: 400 },
    );
  try {
    const profile = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: parsed.data.displayName,
        username: parsed.data.username,
        bio: parsed.data.bio || null,
        avatarUrl: parsed.data.avatarUrl || null,
      },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 },
      );
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
