import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  favoriteGenres: z.array(z.string()).max(10).optional(),
  favoriteCreators: z.array(z.string()).max(10).optional(),
  favoriteServices: z.array(z.string()).max(10).optional(),
  libraryPublic: z.boolean().optional(),
  showRatings: z.boolean().optional(),
  showReviews: z.boolean().optional(),
  showStats: z.boolean().optional(),
  showActivity: z.boolean().optional(),
  showFavorites: z.boolean().optional(),
  hideAdult: z.boolean().optional(),
});

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const json = await request.json();
    const parsed = settingsSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
    });
    
    return NextResponse.json({ profile: updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Could not update profile settings." }, { status: 500 });
  }
}
