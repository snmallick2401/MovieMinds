
import { prisma } from "@/lib/prisma";
import type { PaginatedReviews, ReviewItem, ReviewStats } from "@/types/review";

const authorSelect = { username: true, displayName: true, avatarUrl: true };
const reviewInclude = { user: { select: authorSelect } };

function serializeReview(
  review: {
    id: string;
    userId: string;
    mediaId: string;
    title: string | null;
    body: string;
    spoiler: boolean;
    visibility: "PUBLIC" | "PRIVATE";
    likeCount: number;
    createdAt: Date;
    updatedAt: Date;
    editedAt: Date | null;
    user: { username: string; displayName: string; avatarUrl: string | null };
  },
  ratings: Map<string, number>,
): ReviewItem {
  return {
    id: review.id,
    userId: review.userId,
    mediaId: review.mediaId,
    title: review.title,
    body: review.body,
    spoiler: review.spoiler,
    visibility: review.visibility,
    likeCount: review.likeCount,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    editedAt: review.editedAt?.toISOString() ?? null,
    author: review.user,
    rating: ratings.get(review.userId) ?? null,
  };
}

import { unstable_cache } from "next/cache";

export const getMediaReviewStats = unstable_cache(
  async (mediaId: string): Promise<ReviewStats> => {
    const [total, aggregate] = await Promise.all([
      prisma.review.count({ where: { mediaId, visibility: "PUBLIC" } }),
      prisma.userRating.aggregate({ where: { mediaId }, _avg: { rating: true } }),
    ]);
    return { total, averageUserRating: aggregate._avg.rating ? Number(aggregate._avg.rating) : null };
  },
  ["media-review-stats"],
  { revalidate: 3600, tags: ["reviews"] }
);

export async function getMediaReviews(
  mediaId: string,
  currentUserId: string | null,
  page = 1,
  pageSize = 20,
): Promise<PaginatedReviews> {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;
  const visibility = currentUserId
    ? { OR: [{ visibility: "PUBLIC" as const }, { userId: currentUserId }] }
    : { visibility: "PUBLIC" as const };
  const [userReview, reviews, total, stats] = await Promise.all([
    currentUserId
      ? prisma.review.findUnique({
          where: { userId_mediaId: { userId: currentUserId, mediaId } },
          include: reviewInclude,
        })
      : null,
    prisma.review.findMany({
      where: {
        mediaId,
        ...visibility,
        ...(currentUserId ? { userId: { not: currentUserId } } : {}),
      },
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.review.count({
      where: {
        mediaId,
        ...visibility,
        ...(currentUserId ? { userId: { not: currentUserId } } : {}),
      },
    }),
    getMediaReviewStats(mediaId),
  ]);
  const authorIds = [
    ...new Set([
      ...(userReview ? [userReview.userId] : []),
      ...reviews.map((review) => review.userId),
    ]),
  ];
  const ratings = await prisma.userRating.findMany({
    where: {
      mediaId,
      userId: { in: authorIds },
      user: {
        OR: [
          ...(currentUserId ? [{ id: currentUserId }] : []),
          { showRatings: true, libraryPublic: true },
        ],
      },
    },
    select: { userId: true, rating: true },
  });
  const ratingsByUser = new Map(ratings.map((rating) => [rating.userId, Number(rating.rating)]));
  return {
    userReview: userReview ? serializeReview(userReview, ratingsByUser) : null,
    items: reviews.map((review) => serializeReview(review, ratingsByUser)),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats,
  };
}

export async function getReviewByIdForUser(id: string, userId: string) {
  return prisma.review.findFirst({ where: { id, userId }, include: reviewInclude });
}
