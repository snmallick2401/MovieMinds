import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, showActivity: true, libraryPublic: true, showRatings: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    const isOwner = currentUser?.id === user.id;

    if (!isOwner && (!user.showActivity || !user.libraryPublic)) {
      return NextResponse.json({ items: [], nextCursor: null });
    }

    // Determine types to exclude for external viewers
    const excludedTypes: ("WISHLISTED" | "RATED")[] = [];
    if (!isOwner) {
      excludedTypes.push("WISHLISTED"); // Wishlist items are strictly private
      if (!user.showRatings) {
        excludedTypes.push("RATED"); // Hide ratings if user disabled rating visibility
      }
    }
    
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = 20;
    
    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        ...(excludedTypes.length > 0 ? { type: { notIn: excludedTypes } } : {}),
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        media: {
          select: {
            id: true,
            slug: true,
            title: true,
            posterUrl: true,
            year: true,
            mediaType: true,
          }
        },
        user: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        rating: {
          select: {
            rating: true
          }
        }
      }
    });
    
    let nextCursor: string | null = null;
    if (activities.length > limit) {
      const nextItem = activities.pop();
      nextCursor = nextItem!.id;
    }
    
    // For REVIEWED types, optionally fetch the review title/spoiler state
    // To make it efficient, gather all reviewIds
    const reviewIds = activities.filter(a => a.type === "REVIEWED" && a.reviewId).map(a => a.reviewId!);
    const reviews = reviewIds.length > 0 
      ? await prisma.review.findMany({
          where: { id: { in: reviewIds }, visibility: "PUBLIC" },
          select: { id: true, title: true, spoiler: true }
        })
      : [];
    const reviewsMap = new Map(reviews.map(r => [r.id, r]));
    
    const formattedActivities = activities.map(activity => {
      let reviewData = undefined;
      if (activity.type === "REVIEWED" && activity.reviewId) {
        const r = reviewsMap.get(activity.reviewId);
        if (r) {
          reviewData = { title: r.title, spoiler: r.spoiler };
        }
      }
      
      return {
        id: activity.id,
        type: activity.type,
        createdAt: activity.createdAt.toISOString(),
        media: activity.media,
        user: activity.user,
        rating: activity.rating?.rating ? Number(activity.rating.rating) : null,
        review: reviewData,
      };
    });
    
    return NextResponse.json({ 
      items: formattedActivities.filter(a => a.type !== "REVIEWED" || a.review), 
      nextCursor 
    });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json({ error: "Could not fetch activity feed." }, { status: 500 });
  }
}
