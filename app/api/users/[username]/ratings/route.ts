import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const cleanUsername = username?.trim();
    if (!cleanUsername) {
      return NextResponse.json({ error: "Ratings are not public." }, { status: 404 });
    }

    const page = Math.max(1, Math.floor(Number(request.nextUrl.searchParams.get("page")) || 1));
    const pageSize = Math.min(50, Math.max(1, Math.floor(Number(request.nextUrl.searchParams.get("pageSize")) || 20)));

    const profile = await prisma.user.findFirst({
      where: { username: { equals: cleanUsername, mode: "insensitive" } },
      select: { id: true, libraryPublic: true, showRatings: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Ratings are not public." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store, must-revalidate" },
        },
      );
    }

    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    const isOwner = currentUser?.id === profile.id;

    // Enforce privacy: only allow access if owner OR if both library and ratings are public
    if (!isOwner && (!profile.libraryPublic || !profile.showRatings)) {
      return NextResponse.json(
        { error: "Ratings are not public." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store, must-revalidate" },
        },
      );
    }

    const [items, total] = await prisma.$transaction([
      prisma.userRating.findMany({
        where: { userId: profile.id },
        include: {
          media: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              year: true,
              mediaType: true,
              communityAverageRating: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.userRating.count({ where: { userId: profile.id } }),
    ]);

    return NextResponse.json(
      {
        items: items.map((item) => ({
          ...item,
          rating: Number(item.rating),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          media: {
            ...item.media,
            communityAverageRating: item.media.communityAverageRating
              ? Number(item.media.communityAverageRating)
              : null,
          },
        })),
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      {
        headers: {
          "Cache-Control": isOwner
            ? "private, no-cache, no-store, must-revalidate"
            : "public, max-age=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    logger.error({ msg: "Ratings fetch error", error });
    return NextResponse.json({ error: "Could not fetch ratings." }, { status: 500 });
  }
}
