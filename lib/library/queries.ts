import { prisma } from "@/lib/prisma";
import {
  mediaForLibrary,
  serializeLibraryEntry,
  serializeWishlistEntry,
} from "@/lib/library/serializers";
import type { LibraryEntry, WishlistEntry } from "@/types/library";

export async function getLibraryDashboard(
  userId: string,
): Promise<{ items: LibraryEntry[]; wishlist: WishlistEntry[] }> {
  const [entries, wishlist, ratings] = await Promise.all([
    prisma.userLibrary.findMany({
      where: { userId },
      include: { media: { include: mediaForLibrary } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.wishlist.findMany({
      where: { userId },
      include: { media: { include: mediaForLibrary } },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    }),
    prisma.userRating.findMany({
      where: { userId },
      select: { mediaId: true, rating: true },
    }),
  ]);
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
}

export async function getUserMediaState(userId: string, mediaId: string) {
  const [library, wishlist, rating] = await Promise.all([
    prisma.userLibrary.findUnique({ where: { userId_mediaId: { userId, mediaId } } }),
    prisma.wishlist.findUnique({ where: { userId_mediaId: { userId, mediaId } } }),
    prisma.userRating.findUnique({ where: { userId_mediaId: { userId, mediaId } } }),
  ]);
  return { library, wishlist, rating };
}

export async function getUserStats(userId: string) {
  const [completed, ratings, history, library] = await Promise.all([
    prisma.userLibrary.findMany({
      where: { userId, completed: true },
      include: { media: { include: { genres: { include: { genre: true } } } } },
    }),
    prisma.userRating.findMany({
      where: { userId },
      select: { rating: true, createdAt: true },
    }),
    prisma.watchHistory.findMany({ where: { userId }, select: { watchedAt: true } }),
    prisma.userLibrary.findMany({ where: { userId }, select: { status: true } }),
  ]);
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
    const key = rating.rating.toFixed(1);
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
}
