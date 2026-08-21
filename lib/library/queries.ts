import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma, type UserLibrary, type Wishlist } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  mediaForLibrary,
  serializeLibraryEntry,
  serializeWishlistEntry,
} from "@/lib/library/serializers";
import type { LibraryEntry, WishlistEntry } from "@/types/library";

const getCachedDashboard = unstable_cache(
  async (id: string) => {
    const entries = await prisma.userLibrary.findMany({
      where: { userId: id },
      include: { media: { include: mediaForLibrary } },
      orderBy: { updatedAt: "desc" },
    });
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: id },
      include: { media: { include: mediaForLibrary } },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    const ratings = await prisma.userRating.findMany({
      where: { userId: id },
      select: { mediaId: true, rating: true },
    });
    const ratingsByMedia = new Map(
      ratings.map((rating) => [rating.mediaId, Number(rating.rating)]),
    );
    return {
      items: entries.map((entry) =>
        serializeLibraryEntry({
          ...entry,
          personalRating: ratingsByMedia.get(entry.mediaId) ?? null,
        }),
      ),
      wishlist: wishlist.map(serializeWishlistEntry),
    };
  },
  ["library-dashboard"],
  { revalidate: 3600, tags: ["library"] }
);

export const getLibraryDashboard = async (
  userId: string,
): Promise<{ items: LibraryEntry[]; wishlist: WishlistEntry[] }> => {
  try {
    return await getCachedDashboard(userId);
  } catch (error) {
    logger.error({ msg: "getLibraryDashboard failed — returning empty", error });
    return { items: [], wishlist: [] };
  }
};

interface RawUserState {
  library: UserLibrary | null;
  wishlist: Wishlist | null;
  rating: { id: string; userId: string; mediaId: string; rating: number | string; createdAt: string; updatedAt: string } | null;
}

export const getUserMediaState = cache(async (userId: string, mediaId: string) => {
  try {
    const results = await prisma.$queryRaw<RawUserState[]>(
      Prisma.sql`
        SELECT 
          (SELECT row_to_json(l) FROM "user_library" l WHERE l."userId" = ${userId}::uuid AND l."mediaId" = ${mediaId}) AS library,
          (SELECT row_to_json(w) FROM "wishlists" w WHERE w."userId" = ${userId}::uuid AND w."mediaId" = ${mediaId}) AS wishlist,
          (SELECT row_to_json(r) FROM "user_ratings" r WHERE r."userId" = ${userId}::uuid AND r."mediaId" = ${mediaId}) AS rating
      `
    );

    const row = results?.[0];
    if (!row) return { library: null, wishlist: null, rating: null };
    return {
      library: row.library ?? null,
      wishlist: row.wishlist ?? null,
      rating: row.rating ? { ...row.rating, rating: Number(row.rating.rating) } : null,
    };
  } catch {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        library: { where: { mediaId } },
        wishlist: { where: { mediaId } },
        ratings: { where: { mediaId } },
      },
    });

    if (!user) return { library: null, wishlist: null, rating: null };
    return { 
      library: user.library[0] ?? null, 
      wishlist: user.wishlist[0] ?? null, 
      rating: user.ratings[0] ?? null 
    };
  }
});

const emptyUserStats = {
  totalWatched: 0,
  moviesWatched: 0,
  animeWatched: 0,
  tvWatched: 0,
  hoursWatched: 0,
  averageRating: null as number | null,
  completionRate: 0,
  favoriteGenres: [] as { name: string; count: number }[],
  mediaTypes: [] as { name: string; count: number }[],
  watchesByMonth: [] as { month: string; count: number }[],
  ratingsDistribution: [] as { rating: string; count: number }[],
};

const getCachedStats = unstable_cache(
  async (id: string) => {
    const completed = await prisma.userLibrary.findMany({
      where: { userId: id, completed: true },
      include: { media: { include: { genres: { include: { genre: true } } } } },
    });
    const ratings = await prisma.userRating.findMany({
      where: { userId: id },
      select: { rating: true, createdAt: true },
    });
    const history = await prisma.watchHistory.findMany({ where: { userId: id }, select: { watchedAt: true } });
    const library = await prisma.userLibrary.findMany({ where: { userId: id }, select: { status: true } });
    const byType = new Map<string, number>();
    const byGenre = new Map<string, number>();
    let hoursWatched = 0;
    for (const entry of completed) {
      byType.set(entry.media.mediaType, (byType.get(entry.media.mediaType) ?? 0) + 1);
      hoursWatched += entry.media.runtime ?? (entry.media.episodeCount ?? 0) * 24;
      for (const { genre } of entry.media.genres)
        byGenre.set(genre.name, (byGenre.get(genre.name) ?? 0) + 1);
    }
    const months = new Map<string, number>();
    for (const item of history) {
      const key = item.watchedAt.toISOString().slice(0, 7);
      months.set(key, (months.get(key) ?? 0) + 1);
    }
    const distribution = new Map<string, number>();
    for (const rating of ratings) {
      const key = Number(rating.rating).toFixed(1);
      distribution.set(key, (distribution.get(key) ?? 0) + 1);
    }
    return {
      totalWatched: completed.length,
      moviesWatched: completed.filter((entry) =>
        ["MOVIE", "DOCUMENTARY"].includes(entry.media.mediaType),
      ).length,
      animeWatched: completed.filter((entry) =>
        ["ANIME", "ANIME_MOVIE", "OVA"].includes(entry.media.mediaType),
      ).length,
      tvWatched: completed.filter((entry) => entry.media.mediaType === "TV").length,
      hoursWatched: Math.round(hoursWatched / 60),
      averageRating: ratings.length
        ? ratings.reduce((sum, item) => sum + Number(item.rating), 0) / ratings.length
        : null,
      completionRate: library.length
        ? Math.round((completed.length / library.length) * 100)
        : 0,
      favoriteGenres: [...byGenre.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      mediaTypes: [...byType.entries()].map(([name, count]) => ({ name, count })),
      watchesByMonth: [...months.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
      ratingsDistribution: [...distribution.entries()]
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rating, count]) => ({ rating, count })),
    };
  },
  ["user-stats"],
  { revalidate: 3600, tags: ["user-stats"] }
);

export const getUserStats = async (userId: string) => {
  try {
    return await getCachedStats(userId);
  } catch (error) {
    logger.error({ msg: "getUserStats failed — returning empty stats", error });
    return emptyUserStats;
  }
};
