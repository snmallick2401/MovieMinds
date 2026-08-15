import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  normalizedToDetail,
  normalizedToSummary,
  serializeMediaDetail,
  serializeMediaSummary,
} from "@/lib/media/serializers";
import { searchTmdb, fetchTmdbDetails } from "@/lib/tmdb/client";
import { searchAniList, fetchAniListDetails } from "@/lib/anilist/client";
import type {
  MediaDetail,
  MediaFilters,
  MediaSummary,
  NormalizedMedia,
  PaginatedMedia,
} from "@/types/media";

const summaryRelations = {
  genres: { include: { genre: true } },
} satisfies Prisma.MediaInclude;

const detailRelations = {
  genres: { include: { genre: true } },
  platforms: { include: { platform: true } },
  credits: { include: { person: true }, orderBy: { order: "asc" } },
} satisfies Prisma.MediaInclude;

function whereFromFilters(filters: MediaFilters): Prisma.MediaWhereInput {
  const and: Prisma.MediaWhereInput[] = [];
  if (filters.query) {
    const isLight = (filters.pageSize ?? 24) <= 10;
    const queryConditions: Prisma.MediaWhereInput[] = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { originalTitle: { contains: filters.query, mode: "insensitive" } },
    ];
    if (!isLight) {
      queryConditions.push({ alternativeTitles: { has: filters.query } });
    }
    and.push({ OR: queryConditions });
  }

  if (filters.genres?.length)
    and.push({ genres: { some: { genre: { name: { in: filters.genres } } } } });
  if (filters.types?.length) and.push({ mediaType: { in: filters.types } });
  if (filters.languages?.length) and.push({ language: { in: filters.languages } });
  if (filters.countries?.length) and.push({ country: { in: filters.countries } });
  if (filters.platforms?.length)
    and.push({ platforms: { some: { platform: { name: { in: filters.platforms } } } } });
  if (filters.ratings?.length) and.push({ contentRating: { in: filters.ratings } });
  if (filters.statuses?.length) and.push({ status: { in: filters.statuses } });
  if (filters.yearFrom || filters.yearTo)
    and.push({ year: { gte: filters.yearFrom, lte: filters.yearTo } });
  if (filters.minRating) and.push({ averageRating: { gte: filters.minRating } });
  if (filters.runtime === "under-90") and.push({ runtime: { lt: 90 } });
  if (filters.runtime === "90-120") and.push({ runtime: { gte: 90, lte: 120 } });
  if (filters.runtime === "120-150") and.push({ runtime: { gt: 120, lte: 150 } });
  if (filters.runtime === "over-150") and.push({ runtime: { gt: 150 } });
  if (filters.sort === "rating") {
    and.push({ averageRating: { not: null }, voteCount: { gte: 5 } });
  }
  return and.length ? { AND: and } : {};
}

function orderFromFilters(filters: MediaFilters): Prisma.MediaOrderByWithRelationInput[] {
  if (filters.sort === "rating")
    return [{ averageRating: "desc" }, { voteCount: "desc" }, { popularity: "desc" }];
  if (filters.sort === "newest")
    return [{ releaseDate: "desc" }, { popularity: "desc" }];
  if (filters.sort === "recent") return [{ createdAt: "desc" }];
  return [{ popularity: "desc" }, { voteCount: "desc" }];
}

import {
  autoExpandFilterCatalog,
  autoPersistSearchResults,
} from "@/lib/media/expansion";

export async function findMedia(filters: MediaFilters = {}): Promise<PaginatedMedia> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 24;
  const where = whereFromFilters(filters);
  const isLightSearch = !!filters.query && pageSize <= 10;

  // 1. Fetch from database first
  const [dbItems, total] = await Promise.all([
    prisma.media.findMany({
      where,
      include: summaryRelations,
      orderBy: orderFromFilters(filters),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    isLightSearch ? Promise.resolve(0) : prisma.media.count({ where }),
  ]);


  const serializedDbItems = dbItems.map(serializeMediaSummary);

  if (!filters.query) {
    // Only auto-expand when explicitly browsing the catalog (pageSize > 8)
    // This prevents Next.js from blocking the Home Page SSR on dangling background expansion promises.
    if (total < 800 && pageSize > 8) {
      autoExpandFilterCatalog(filters, total);
    }
    return {
      items: serializedDbItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 2. Fetch from external sources only if DB returned few results
  let externalItems: NormalizedMedia[] = [];
  if (!isLightSearch || serializedDbItems.length < 5) {
    const searchSignal = AbortSignal.timeout(150);
    const [tmdbResults, anilistResults] = await Promise.all([
      searchTmdb(filters.query, searchSignal).catch(() => []),
      searchAniList(filters.query, searchSignal).catch(() => []),
    ]);
    externalItems = [...tmdbResults, ...anilistResults];
    autoPersistSearchResults(externalItems).catch(() => {});
  }

  const existingTitles = new Set(serializedDbItems.map((item) => item.title.toLowerCase()));
  const externalSummaries = externalItems
    .filter((m) => !existingTitles.has(m.title.toLowerCase()))
    .map(normalizedToSummary);

  const combinedItems = [...serializedDbItems, ...externalSummaries];
  const combinedTotal = (isLightSearch ? serializedDbItems.length : total) + externalSummaries.length;

  return {
    items: combinedItems.slice(0, pageSize),
    total: combinedTotal,
    page,
    pageSize,
    totalPages: Math.ceil(combinedTotal / pageSize),
  };
}


import { cache } from "react";
import { refreshMedia } from "@/lib/media/sync";

const fetchDbMediaDetail = (id: string) =>
  unstable_cache(
    async () => {
      const media = await prisma.media.findUnique({ where: { id }, include: detailRelations });
      return media ? serializeMediaDetail(media) : null;
    },
    [`media-detail-${id}`],
    { revalidate: 3600, tags: [`media-${id}`] }
  )();

export const findMediaById = cache(async (id: string): Promise<MediaDetail | null> => {
  if (id.startsWith("tmdb-")) {
    const sourceId = id.replace("tmdb-", "");
    try {
      const normalized = await fetchTmdbDetails(sourceId, "MOVIE");
      return normalizedToDetail(normalized);
    } catch {
      try {
        const normalizedTv = await fetchTmdbDetails(sourceId, "TV");
        return normalizedToDetail(normalizedTv);
      } catch {
        return null;
      }
    }
  }

  if (id.startsWith("anilist-")) {
    const sourceId = id.replace("anilist-", "");
    try {
      const normalized = await fetchAniListDetails(sourceId);
      return normalizedToDetail(normalized);
    } catch {
      return null;
    }
  }

  return fetchDbMediaDetail(id);
});

/**
 * Automatically hydrates missing credits/platforms for a media item if they are empty.
 * Call this from a Suspense boundary so it doesn't block the critical render path.
 */
export async function hydrateMediaDetails(media: MediaDetail): Promise<MediaDetail> {
  // If credits or platforms already exist, return immediately without blocking network calls
  if ((media.credits && media.credits.length > 0) || (media.platforms && media.platforms.length > 0)) {
    return media;
  }

  const isStale = !media.sourceUpdatedAt || 
    (new Date().getTime() - new Date(media.sourceUpdatedAt).getTime() > 7 * 24 * 60 * 60 * 1000);

  if (!isStale) {
    return media;
  }

  try {
    const refreshed = await refreshMedia(media.source, media.sourceId, media.mediaType as any);
    const reFetched = await prisma.media.findUnique({ where: { id: refreshed.id }, include: detailRelations });
    if (reFetched) {
      return serializeMediaDetail(reFetched);
    }
  } catch {
    // Return original media silently on timeout or network error
  }
  
  return media;
}



import {
  getAiUserRecommendations,
  getAiSimilarMedia,
  type AiMediaItem,
  type AiUserProfile,
} from "@/lib/ai/client";

export async function getPersonalizedRecommendations(
  userId: string | null,
  limit = 6
): Promise<MediaSummary[]> {
  // 1. Fetch candidate media from DB
  const candidateRows = await prisma.media.findMany({
    where: {
      status: { in: ["RELEASED", "FINISHED"] },
      posterUrl: { not: null },
    },
    include: summaryRelations,
    orderBy: [{ popularity: "desc" }, { voteCount: "desc" }],
    take: 36,
  });

  const candidates: AiMediaItem[] = candidateRows.map((m) => ({
    id: m.id,
    title: m.title,
    originalTitle: m.originalTitle,
    mediaType: m.mediaType,
    genres: m.genres.map((g) => g.genre.name),
    description: m.description,
    year: m.year,
    averageRating: m.averageRating,
    popularity: m.popularity,
    posterUrl: m.posterUrl,
  }));

  const candidateMap = new Map(candidateRows.map((m) => [m.id, serializeMediaSummary(m)]));

  if (!userId) {
    // Guest fallback: top rated with default match percentages
    const defaultPcts = [96, 94, 91, 89, 88, 86];
    return candidateRows.slice(0, limit).map((m, idx) => {
      const summary = serializeMediaSummary(m);
      summary.matchPercentage = defaultPcts[idx % defaultPcts.length];
      summary.recommendationReason = m.genres[0]
        ? `Top pick in ${m.genres[0].genre.name}`
        : "Trending on MovieMinds";
      return summary;
    });
  }

  // 2. Fetch User's library, ratings, and profile for AI engine
  const [userProfile, library, ratings, favorites] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { favoriteGenres: true } }).catch(() => null),
    prisma.userLibrary.findMany({ where: { userId } }).catch(() => []),
    prisma.userRating.findMany({ where: { userId } }).catch(() => []),
    prisma.userFavorite.findMany({ where: { userId } }).catch(() => []),
  ]);

  const favSet = new Set(favorites.map((f) => f.mediaId));
  const ratingMap = new Map(ratings.map((r) => [r.mediaId, Number(r.rating)]));
  const statusMap = new Map(library.map((l) => [l.mediaId, l.status]));

  const allInteractedMediaIds = new Set([
    ...library.map((l) => l.mediaId),
    ...ratings.map((r) => r.mediaId),
    ...favorites.map((f) => f.mediaId),
  ]);

  const interactions = Array.from(allInteractedMediaIds).map((mId) => ({
    mediaId: mId,
    rating: ratingMap.get(mId) ?? null,
    status: statusMap.get(mId) ?? null,
    isFavorite: favSet.has(mId),
  }));

  const aiUserPayload: AiUserProfile = {
    userId,
    favoriteGenres: userProfile?.favoriteGenres ?? [],
    interactions,
  };

  // 3. Call Python AI Microservice
  const aiResults = await getAiUserRecommendations(aiUserPayload, candidates, limit);

  if (aiResults && aiResults.length > 0) {
    const recommended: MediaSummary[] = [];
    for (const res of aiResults) {
      const item = candidateMap.get(res.mediaId);
      if (item) {
        recommended.push({
          ...item,
          matchPercentage: res.matchPercentage,
          recommendationReason: res.reason,
        });
      }
    }
    if (recommended.length >= limit) {
      return recommended.slice(0, limit);
    }
  }

  // 4. Heuristic Fallback if AI service is offline
  const fallbackPcts = [94, 91, 88, 87, 85, 83];
  return candidateRows.slice(0, limit).map((m, idx) => {
    const summary = serializeMediaSummary(m);
    summary.matchPercentage = fallbackPcts[idx % fallbackPcts.length];
    summary.recommendationReason = m.genres[0]
      ? `Top pick in ${m.genres[0].genre.name}`
      : "Trending on MovieMinds";
    return summary;
  });
}

export async function findSimilarMedia(
  media: MediaDetail,
  limit = 8,
): Promise<MediaSummary[]> {
  const candidates = await prisma.media.findMany({
    where: {
      id: { not: media.id },
      mediaType: media.mediaType as any,
    },
    include: summaryRelations,
    orderBy: { popularity: "desc" },
    take: 24,
  });

  const candidateMap = new Map(candidates.map((c) => [c.id, serializeMediaSummary(c)]));

  const targetAi: AiMediaItem = {
    id: media.id,
    title: media.title,
    originalTitle: media.originalTitle,
    mediaType: media.mediaType,
    genres: media.genres.map((g) => g.name),
    description: media.description,
    year: media.year,
    averageRating: media.averageRating,
    popularity: media.popularity,
    posterUrl: media.posterUrl,
  };

  const candidateAi: AiMediaItem[] = candidates.map((c) => ({
    id: c.id,
    title: c.title,
    originalTitle: c.originalTitle,
    mediaType: c.mediaType,
    genres: c.genres.map((g) => g.genre.name),
    description: c.description,
    year: c.year,
    averageRating: c.averageRating,
    popularity: c.popularity,
    posterUrl: c.posterUrl,
  }));

  const aiSimilar = await getAiSimilarMedia(targetAi, candidateAi, limit);
  if (aiSimilar && aiSimilar.length > 0) {
    const results: MediaSummary[] = [];
    for (const s of aiSimilar) {
      const item = candidateMap.get(s.mediaId);
      if (item) {
        results.push({
          ...item,
          matchPercentage: s.matchPercentage,
          recommendationReason:
            s.sharedGenres.length > 0
              ? `Shared ${s.sharedGenres.join(", ")}`
              : `Similar to ${media.title}`,
        });
      }
    }
    if (results.length > 0) return results;
  }

  return candidates.slice(0, limit).map(serializeMediaSummary);
}

export const getGenres = unstable_cache(
  async () =>
    prisma.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ["catalog-genres"],
  { revalidate: 3600, tags: ["catalog"] },
);

export const getExploreSections = unstable_cache(
  async () => {
    const query = async (filters: MediaFilters, limit = 8) =>
      (await findMedia({ ...filters, pageSize: limit })).items;
    return {
      trending: await query({ sort: "popular" }),
      popularMovies: await query({ types: ["MOVIE"], sort: "popular" }),
      popularAnime: await query({
        types: ["ANIME", "ANIME_MOVIE", "OVA"],
        sort: "popular",
      }),
      topRated: await query({ sort: "rating" }),
      newReleases: await query({ sort: "newest", statuses: ["RELEASED", "FINISHED"] }),
      upcoming: await query({ sort: "newest", statuses: ["UPCOMING"] }),
      recentlyAdded: await query({ sort: "recent" }),
    };
  },
  ["explore-sections"],
  { revalidate: 3600, tags: ["explore"] }
);
