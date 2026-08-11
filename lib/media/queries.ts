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
    and.push({
      OR: [
        { title: { contains: filters.query, mode: "insensitive" } },
        { originalTitle: { contains: filters.query, mode: "insensitive" } },
        { alternativeTitles: { has: filters.query } },
      ],
    });
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

  // 1. Fetch from database first
  const [dbItems, total] = await Promise.all([
    prisma.media.findMany({
      where,
      include: summaryRelations,
      orderBy: orderFromFilters(filters),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.media.count({ where }),
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

  // 2. Fetch from external sources only if there is a query, and catch errors
  const [tmdbResults, anilistResults] = await Promise.all([
    searchTmdb(filters.query).catch((err) => { console.warn("TMDB search failed:", err); return []; }),
    searchAniList(filters.query).catch((err) => { console.warn("AniList search failed:", err); return []; }),
  ]);

  const externalItems = [...tmdbResults, ...anilistResults];
  autoPersistSearchResults(externalItems).catch(() => {});

  const existingTitles = new Set(serializedDbItems.map((item) => item.title.toLowerCase()));
  const externalSummaries = externalItems
    .filter((m) => !existingTitles.has(m.title.toLowerCase()))
    .map(normalizedToSummary);

  const combinedItems = [...serializedDbItems, ...externalSummaries];
  const combinedTotal = total + externalSummaries.length;

  return {
    items: combinedItems.slice(0, pageSize),
    total: combinedTotal,
    page,
    pageSize,
    totalPages: Math.ceil(combinedTotal / pageSize),
  };
}

export async function findMediaById(id: string): Promise<MediaDetail | null> {
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

  const media = await prisma.media.findUnique({ where: { id }, include: detailRelations });
  return media ? serializeMediaDetail(media) : null;
}


export async function findSimilarMedia(
  media: MediaDetail,
  limit = 8,
): Promise<MediaSummary[]> {
  const genreIds = media.genres.map((genre) => genre.id);
  const getCachedSimilar = unstable_cache(
    async (id: string, mType: string, gIds: string[]) => {
      const items = await prisma.media.findMany({
        where: {
          id: { not: id },
          mediaType: mType as any,
          genres: { some: { genreId: { in: gIds } } },
        },
        include: summaryRelations,
        orderBy: { popularity: "desc" },
        take: limit,
      });
      return items.map(serializeMediaSummary);
    },
    [`similar-${media.id}`],
    { revalidate: 3600, tags: ["similar-media"] }
  );

  return getCachedSimilar(media.id, media.mediaType, genreIds);
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
