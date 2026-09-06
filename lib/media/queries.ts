import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  normalizedToDetail,
  normalizedToSummary,
  serializeMediaDetail,
  serializeMediaSummary,
} from "@/lib/media/serializers";
import { getCachedUser } from "@/lib/profile";
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

const narrowCardSelect = {
  id: true,
  source: true,
  sourceId: true,
  title: true,
  originalTitle: true,
  posterUrl: true,
  releaseDate: true,
  year: true,
  mediaType: true,
  averageRating: true,
  communityAverageRating: true,
  ratingCount: true,
  weightedRating: true,
  popularityScore: true,
  voteCount: true,
  popularity: true,
  description: true,
  genres: {
    select: {
      genre: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

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

export async function findMedia(
  filters: MediaFilters = {},
  options?: { skipCount?: boolean }
): Promise<PaginatedMedia> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 24;

  try {
    const where = whereFromFilters(filters);
    const isLightSearch = !!filters.query && pageSize <= 10;
    const shouldSkipCount = options?.skipCount ?? (isLightSearch || (!filters.page && pageSize <= 12));

    // 1. Fetch from database first
    const [dbItems, total] = await Promise.all([
      prisma.media.findMany({
        where,
        select: narrowCardSelect,
        orderBy: orderFromFilters(filters),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      shouldSkipCount ? Promise.resolve(0) : prisma.media.count({ where }),
    ]);

    const serializedDbItems = dbItems.map((item: any) => serializeMediaSummary(item));

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
  } catch (error) {
    logger.error({ msg: "findMedia failed — returning empty results", error });
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }
}


import { cache } from "react";
import { refreshMedia } from "@/lib/media/sync";

const fetchDbMediaDetail = (id: string) =>
  unstable_cache(
    async () => {
      const media = await prisma.media.findUnique({ 
        where: { id }, 
        include: detailRelations,
        relationLoadStrategy: "join" 
      });
      return media ? serializeMediaDetail(media) : null;
    },
    [`media-detail-${id}`],
    { revalidate: 3600, tags: [`media-${id}`] }
  )();

const fetchDbMediaDetailBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      const media = await prisma.media.findUnique({ 
        where: { slug }, 
        include: detailRelations,
        relationLoadStrategy: "join" 
      });
      return media ? serializeMediaDetail(media) : null;
    },
    [`media-detail-slug-${slug}`],
    { revalidate: 3600, tags: [`media-slug-${slug}`] }
  )();

/**
 * Find media by slug (primary), then by database ID, then by external source IDs.
 * Previously called findMediaById - now supports SEO slug routing.
 */
export const findMediaBySlugOrId = cache(async (slugOrId: string): Promise<MediaDetail | null> => {
  // Check if it looks like a CUID (database ID)
  const isCuid = /^c[a-z0-9]{24,}$/.test(slugOrId);

  // External source IDs
  if (slugOrId.startsWith("tmdb-")) {
    const sourceId = slugOrId.replace("tmdb-", "");
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

  if (slugOrId.startsWith("anilist-")) {
    const sourceId = slugOrId.replace("anilist-", "");
    try {
      const normalized = await fetchAniListDetails(sourceId);
      return normalizedToDetail(normalized);
    } catch {
      return null;
    }
  }

  // Database ID (CUID format) - used for backward compatibility redirect
  if (isCuid) {
    return fetchDbMediaDetail(slugOrId);
  }

  // SEO slug lookup (primary path for new URLs)
  return fetchDbMediaDetailBySlug(slugOrId);
});

/** @deprecated Use findMediaBySlugOrId instead */
export const findMediaById = findMediaBySlugOrId;

const inFlightHydrations = new Set<string>();

/**
 * Automatically hydrates missing credits/platforms for a media item if they are empty.
 * Uses Next.js after() to defer external TMDb syncing to the background so the user request is not blocked.
 */
export async function hydrateMediaDetails(media: MediaDetail): Promise<MediaDetail> {
  const hasCredits = media.credits && media.credits.length > 0;
  const hasPlatforms = media.platforms && media.platforms.length > 0;

  if (hasCredits && hasPlatforms) {
    return media;
  }

  const isStale = !media.sourceUpdatedAt || 
    (new Date().getTime() - new Date(media.sourceUpdatedAt).getTime() > 7 * 24 * 60 * 60 * 1000);
  const isMissingDetails = !hasCredits && !hasPlatforms;
  const recentlySynced = media.lastSyncedAt && (new Date().getTime() - new Date(media.lastSyncedAt).getTime() < 60 * 60 * 1000);

  if ((isStale || isMissingDetails) && !recentlySynced && !inFlightHydrations.has(media.id)) {
    inFlightHydrations.add(media.id);
    try {
      if (typeof after === "function") {
        try {
          after(async () => {
            try {
              const { revalidateTag } = await import("next/cache");
              revalidateTag(`media-${media.id}`);
              revalidateTag("catalog");
            } catch {}
          });
        } catch {}
      }

      await refreshMedia(media.source, media.sourceId, media.mediaType as any);
      inFlightHydrations.delete(media.id);

      const freshMedia = await prisma.media.findUnique({
        where: { id: media.id },
        include: detailRelations,
        relationLoadStrategy: "join"
      });
      if (freshMedia) return serializeMediaDetail(freshMedia);
    } catch {
      // Background sync error handled gracefully
      inFlightHydrations.delete(media.id);
    }
  }

  return media;
}



import {
  getAiUserRecommendations,
  getAiSimilarMedia,
  type AiMediaItem,
  type AiUserProfile,
} from "@/lib/ai/client";

const getCachedRecs = unstable_cache(
  async (userId: string | null, limit: number) => {
    // 1. Fetch candidate media from DB with rich metadata
    const candidateRows = await prisma.media.findMany({
      where: {
        status: { in: ["RELEASED", "FINISHED"] },
        posterUrl: { not: null },
      },
      select: {
        ...narrowCardSelect,
        runtime: true,
        contentRating: true,
        credits: {
          select: {
            role: true,
            job: true,
            person: { select: { name: true } },
          },
          take: 8,
        },
      },
      orderBy: [{ popularity: "desc" }, { voteCount: "desc" }],
      take: 36,
    });

    const candidates: AiMediaItem[] = candidateRows.map((m: any) => {
      const creators = m.credits
        ?.filter((c: any) => c.role === "CREW" || c.job === "Director")
        .map((c: any) => c.person?.name)
        .filter(Boolean) ?? [];
      const cast = m.credits
        ?.filter((c: any) => c.role === "CAST")
        .map((c: any) => c.person?.name)
        .filter(Boolean) ?? [];

      return {
        id: m.id,
        title: m.title,
        originalTitle: m.originalTitle,
        mediaType: m.mediaType,
        genres: m.genres.map((g: any) => g.genre.name),
        creators,
        cast,
        description: m.description,
        year: m.year,
        averageRating: m.averageRating,
        popularity: m.popularity,
        posterUrl: m.posterUrl,
        runtime: m.runtime,
        contentRating: m.contentRating,
      };
    });

    const candidateMap = new Map(candidateRows.map((m: any) => [m.id, serializeMediaSummary(m)]));

    if (!userId) {
      // Guest fallback: top rated with default match percentages
      const defaultPcts = [96, 94, 91, 89, 88, 86];
      return candidateRows.slice(0, limit).map((m: any, idx: number) => {
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
      getCachedUser(userId).catch(() => null),
      prisma.userLibrary.findMany({ where: { userId } }).catch(() => []),
      prisma.userRating.findMany({ where: { userId } }).catch(() => []),
      prisma.userFavorite.findMany({ where: { userId } }).catch(() => []),
    ]);

    const favSet = new Set(favorites.map((f) => f.mediaId));
    const ratingMap = new Map(ratings.map((r) => [r.mediaId, Number(r.rating)]));
    const statusMap = new Map(library.map((l) => [l.mediaId, l.status]));
    const libraryEntryMap = new Map(library.map((l) => [l.mediaId, l]));

    const allInteractedMediaIds = new Set([
      ...library.map((l) => l.mediaId),
      ...ratings.map((r) => r.mediaId),
      ...favorites.map((f) => f.mediaId),
    ]);

    const interactions = Array.from(allInteractedMediaIds).map((mId) => {
      const libEntry = libraryEntryMap.get(mId);
      return {
        mediaId: mId,
        rating: ratingMap.get(mId) ?? null,
        status: statusMap.get(mId) ?? null,
        isFavorite: favSet.has(mId),
        watchedAt: libEntry?.updatedAt?.toISOString() ?? null,
      };
    });

    const aiUserPayload: AiUserProfile = {
      userId,
      favoriteGenres: userProfile?.favoriteGenres ?? [],
      favoriteCreators: (userProfile as any)?.favoriteCreators ?? [],
      interactions,
    };

    // 3. Call Python AI Microservice with MMR Diversity
    const aiResults = await getAiUserRecommendations(aiUserPayload, candidates, limit, {
      useMmr: true,
      mmrLambda: 0.75,
    });

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
    return candidateRows.slice(0, limit).map((m: any, idx: number) => {
      const summary = serializeMediaSummary(m);
      summary.matchPercentage = fallbackPcts[idx % fallbackPcts.length];
      summary.recommendationReason = m.genres[0]
        ? `Top pick in ${m.genres[0].genre.name}`
        : "Trending on MovieMinds";
      return summary;
    });
  },
  ["personalized-recommendations"],
  { revalidate: 1800, tags: ["user-recs", "catalog"] }
);

export async function getPersonalizedRecommendations(
  userId: string | null,
  limit = 6
): Promise<MediaSummary[]> {
  try {
    return await getCachedRecs(userId, limit);
  } catch (error) {
    logger.error({ msg: "getPersonalizedRecommendations failed — returning empty", error });
    return [];
  }
}

const getCachedSimilar = unstable_cache(
  async (
    targetId: string,
    targetMediaType: string,
    targetTitle: string,
    targetGenres: string[],
    targetCreators: string[],
    targetCast: string[],
    targetYear: number | null,
    limit: number
  ) => {
    const candidateRows = await prisma.media.findMany({
      where: {
        id: { not: targetId },
        mediaType: targetMediaType as any,
      },
      select: {
        ...narrowCardSelect,
        credits: {
          select: {
            role: true,
            job: true,
            person: { select: { name: true } },
          },
          take: 8,
        },
      },
      orderBy: { popularity: "desc" },
      take: 24,
    });

    const candidateSummaries = candidateRows.map((c: any) => serializeMediaSummary(c));
    const candidateMap = new Map(candidateSummaries.map((c) => [c.id, c]));

    const targetAi: AiMediaItem = {
      id: targetId,
      title: targetTitle,
      mediaType: targetMediaType,
      genres: targetGenres,
      creators: targetCreators,
      cast: targetCast,
      year: targetYear,
    };

    const candidateAi: AiMediaItem[] = candidateRows.map((c: any) => {
      const creators = c.credits
        ?.filter((cr: any) => cr.role === "CREW" || cr.job === "Director")
        .map((cr: any) => cr.person?.name)
        .filter(Boolean) ?? [];
      const cast = c.credits
        ?.filter((cr: any) => cr.role === "CAST")
        .map((cr: any) => cr.person?.name)
        .filter(Boolean) ?? [];

      return {
        id: c.id,
        title: c.title,
        originalTitle: c.originalTitle,
        mediaType: c.mediaType,
        genres: c.genres.map((g: any) => g.genre.name),
        creators,
        cast,
        year: c.year,
        averageRating: c.averageRating,
        popularity: c.popularity,
        posterUrl: c.posterUrl,
      };
    });

    const aiSimilar = await getAiSimilarMedia(targetAi, candidateAi, limit);
    if (aiSimilar && aiSimilar.length > 0) {
      const results: MediaSummary[] = [];
      for (const s of aiSimilar) {
        const item = candidateMap.get(s.mediaId);
        if (item) {
          let reason = `Similar to ${targetTitle}`;
          if (s.sharedCreators && s.sharedCreators.length > 0) {
            reason = `Directed by ${s.sharedCreators[0]}`;
          } else if (s.sharedGenres && s.sharedGenres.length > 0) {
            reason = `Shared ${s.sharedGenres.slice(0, 2).join(", ")}`;
          }

          results.push({
            ...item,
            matchPercentage: s.matchPercentage,
            recommendationReason: reason,
          });
        }
      }
      if (results.length > 0) return results;
    }

    return candidateSummaries.slice(0, limit);
  },
  ["similar-media"],
  { revalidate: 3600, tags: ["similar-media"] }
);

export async function findSimilarMedia(
  media: MediaDetail,
  limit = 8,
): Promise<MediaSummary[]> {
  try {
    const creators = (media.credits || [])
      .filter((c) => c.role === "CREW" || c.job === "Director")
      .map((c) => c.name);
    const cast = (media.credits || [])
      .filter((c) => c.role === "CAST")
      .map((c) => c.name);

    return await getCachedSimilar(
      media.id,
      media.mediaType,
      media.title,
      media.genres.map((g) => g.name),
      creators,
      cast,
      media.year,
      limit
    );
  } catch (error) {
    logger.error({ msg: "findSimilarMedia failed — returning empty", error });
    return [];
  }
}

export const getGenres = unstable_cache(
  async () =>
    prisma.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ["catalog-genres"],
  { revalidate: 3600, tags: ["catalog"] },
);

export const emptyExploreSections = {
  trending: [] as MediaSummary[],
  popularMovies: [] as MediaSummary[],
  popularAnime: [] as MediaSummary[],
  topRated: [] as MediaSummary[],
  newReleases: [] as MediaSummary[],
  upcoming: [] as MediaSummary[],
  recentlyAdded: [] as MediaSummary[],
};

export const getExploreSections = unstable_cache(
  async () => {
    try {
      const query = async (filters: MediaFilters, limit = 8) =>
        (await findMedia({ ...filters, pageSize: limit }, { skipCount: true })).items;
      
      const [
        trending,
        popularMovies,
        popularAnime,
        topRated,
        newReleases,
        upcoming,
        recentlyAdded
      ] = await Promise.all([
        query({ sort: "popular" }),
        query({ types: ["MOVIE"], sort: "popular" }),
        query({ types: ["ANIME", "ANIME_MOVIE", "OVA"], sort: "popular" }),
        query({ sort: "rating" }),
        query({ sort: "newest", statuses: ["RELEASED", "FINISHED"] }),
        query({ sort: "newest", statuses: ["UPCOMING"] }),
        query({ sort: "recent" }),
      ]);

      let finalTrending = trending;
      if (finalTrending.length === 0) {
        finalTrending = (await prisma.media.findMany({
          where: { posterUrl: { not: null } },
          select: narrowCardSelect,
          orderBy: [{ popularity: "desc" }, { voteCount: "desc" }],
          take: 8,
        })).map((m: any) => serializeMediaSummary(m));
      }

      let finalPopularMovies = popularMovies;
      if (finalPopularMovies.length === 0) {
        finalPopularMovies = (await prisma.media.findMany({
          where: { mediaType: "MOVIE", posterUrl: { not: null } },
          select: narrowCardSelect,
          orderBy: [{ popularity: "desc" }, { voteCount: "desc" }],
          take: 8,
        })).map((m: any) => serializeMediaSummary(m));
        if (finalPopularMovies.length === 0) {
          finalPopularMovies = finalTrending;
        }
      }

      let finalPopularAnime = popularAnime;
      if (finalPopularAnime.length === 0) {
        finalPopularAnime = (await prisma.media.findMany({
          where: { mediaType: { in: ["ANIME", "ANIME_MOVIE", "OVA"] }, posterUrl: { not: null } },
          select: narrowCardSelect,
          orderBy: [{ popularity: "desc" }, { voteCount: "desc" }],
          take: 8,
        })).map((m: any) => serializeMediaSummary(m));
        if (finalPopularAnime.length === 0) {
          finalPopularAnime = finalTrending;
        }
      }

      let finalTopRated = topRated;
      if (finalTopRated.length === 0) {
        finalTopRated = (await prisma.media.findMany({
          where: { averageRating: { not: null }, posterUrl: { not: null } },
          select: narrowCardSelect,
          orderBy: [{ averageRating: "desc" }, { popularity: "desc" }],
          take: 8,
        })).map((m: any) => serializeMediaSummary(m));
      }

      return {
        trending: finalTrending,
        popularMovies: finalPopularMovies,
        popularAnime: finalPopularAnime,
        topRated: finalTopRated,
        newReleases,
        upcoming,
        recentlyAdded,
      };
    } catch (err) {
      logger.error({ msg: "getExploreSections failed, executing emergency fallback", error: err });
      const emergencyMedia = (await prisma.media.findMany({
        where: { posterUrl: { not: null } },
        select: narrowCardSelect,
        orderBy: [{ popularity: "desc" }, { voteCount: "desc" }],
        take: 8,
      })).map((m: any) => serializeMediaSummary(m));
      return {
        trending: emergencyMedia,
        popularMovies: emergencyMedia,
        popularAnime: emergencyMedia,
        topRated: emergencyMedia,
        newReleases: emergencyMedia,
        upcoming: emergencyMedia,
        recentlyAdded: emergencyMedia,
      };
    }
  },
  ["explore-sections"],
  { revalidate: 3600, tags: ["explore", "catalog"] }
);
