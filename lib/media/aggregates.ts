import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RatingDistributionItem } from "@/types/rating";

type RatingClient = PrismaClient | Prisma.TransactionClient;

const RATING_BUCKETS = Array.from({ length: 14 }, (_, index) => (index + 1) / 2).reverse();

/** Rebuilds only one title's cached member-rating aggregates after a mutation. */
export async function recalculateMediaRating(mediaId: string, client: RatingClient = prisma) {
  const aggregate = await client.userRating.aggregate({ where: { mediaId }, _avg: { rating: true }, _count: { rating: true } });
  const ratingCount = aggregate._count.rating;
  const average = aggregate._avg.rating ? Number(aggregate._avg.rating) : null;
  // Bayesian weighting keeps one enthusiastic rating from dominating discovery ordering.
  const minimumVotes = 5; const baseline = 4.9;
  const weighted = average === null ? null : (ratingCount / (ratingCount + minimumVotes)) * average + (minimumVotes / (ratingCount + minimumVotes)) * baseline;
  const popularityScore = weighted === null ? 0 : Number((weighted * Math.log10(ratingCount + 1) * 100).toFixed(2));
  const distribution = await getRatingDistribution(mediaId, client);
  return client.media.update({ where: { id: mediaId }, data: { communityAverageRating: average === null ? null : new Prisma.Decimal(average.toFixed(2)), ratingCount, weightedRating: weighted === null ? null : new Prisma.Decimal(weighted.toFixed(2)), popularityScore, ratingDistribution: distribution as unknown as Prisma.InputJsonValue } });
}

export async function getRatingDistribution(mediaId: string, client: RatingClient = prisma): Promise<RatingDistributionItem[]> {
  const grouped = await client.userRating.groupBy({ by: ["rating"], where: { mediaId }, _count: { rating: true } });
  const total = grouped.reduce((sum, item) => sum + item._count.rating, 0); const counts = new Map(grouped.map((item) => [Number(item.rating), item._count.rating]));
  return RATING_BUCKETS.map((rating) => ({ rating, count: counts.get(rating) ?? 0, percentage: total ? ((counts.get(rating) ?? 0) / total) * 100 : 0 }));
}

const USER_RATING_BUCKETS = Array.from({ length: 14 }, (_, index) => (index + 1) / 2);

export async function getUserRatingDistribution(userId: string): Promise<RatingDistributionItem[]> {
  const grouped = await prisma.userRating.groupBy({ by: ["rating"], where: { userId }, _count: { rating: true } });
  const total = grouped.reduce((sum, item) => sum + item._count.rating, 0); const counts = new Map(grouped.map((item) => [Number(item.rating), item._count.rating]));
  return USER_RATING_BUCKETS.map((rating) => ({ rating, count: counts.get(rating) ?? 0, percentage: total ? ((counts.get(rating) ?? 0) / total) * 100 : 0 }));
}

import { unstable_cache } from "next/cache";

/** Supplies reusable rating analytics without fetching full media rows per chart. */
export const recalculateUserStats = (userId: string) => {
  const getCachedStats = unstable_cache(
    async (id: string) => {
      const aggregate = await prisma.userRating.aggregate({ where: { userId: id }, _avg: { rating: true }, _count: { rating: true } });
      const distribution = await getUserRatingDistribution(id);
      const monthly = await prisma.userRating.findMany({ where: { userId: id }, select: { rating: true, createdAt: true } });
      const byType = await prisma.userRating.findMany({ where: { userId: id }, select: { rating: true, media: { select: { mediaType: true } } } });
      const byGenre = await prisma.userRating.findMany({ where: { userId: id }, select: { rating: true, media: { select: { genres: { include: { genre: true } } } } } });
      const months = new Map<string, { count: number; total: number }>(); const types = new Map<string, number>(); const genres = new Map<string, { count: number; total: number }>();
      for (const item of monthly) { const key = item.createdAt.toISOString().slice(0, 7); const current = months.get(key) ?? { count: 0, total: 0 }; current.count += 1; current.total += Number(item.rating); months.set(key, current); }
      for (const item of byType) types.set(item.media.mediaType, (types.get(item.media.mediaType) ?? 0) + 1);
      for (const item of byGenre) for (const { genre } of item.media.genres) { const current = genres.get(genre.name) ?? { count: 0, total: 0 }; current.count += 1; current.total += Number(item.rating); genres.set(genre.name, current); }
      return { totalRatings: aggregate._count.rating, averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating) : null, distribution, monthlyActivity: [...months.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([month, value]) => ({ month, count: value.count, average: Number((value.total / value.count).toFixed(2)) })), mediaTypeBreakdown: [...types.entries()].map(([name, count]) => ({ name, count })), genreAverages: [...genres.entries()].map(([name, value]) => ({ name, average: Number((value.total / value.count).toFixed(2)), count: value.count })).sort((left, right) => right.average - left.average).slice(0, 8) };
    },
    [`recalc-user-stats-${userId}`],
    { revalidate: 1800, tags: [`user-stats-${userId}`] }
  );

  return getCachedStats(userId);
};
