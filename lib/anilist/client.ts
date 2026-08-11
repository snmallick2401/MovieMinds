import type { NormalizedMedia } from "@/types/media";

function normalizeProviderUrl(value: string | undefined, fallback: string) {
  const candidate = (value ?? fallback).trim();
  const markdownMatch = candidate.match(/^\[.*?\]\((https?:\/\/[^)]+)\)$/);
  return markdownMatch?.[1] ?? candidate;
}

const ANILIST_URL = normalizeProviderUrl(
  process.env.ANILIST_API_URL,
  "https://graphql.anilist.co",
);

type AniListMedia = {
  id: number;
  type: "ANIME";
  format: "TV" | "MOVIE" | "OVA" | "SPECIAL" | "ONA" | "TV_SHORT" | null;
  status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | null;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  synonyms?: string[];
  description?: string | null;
  coverImage?: { extraLarge?: string | null; large?: string | null } | null;
  bannerImage?: string | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  episodes?: number | null;
  duration?: number | null;
  averageScore?: number | null;
  popularity?: number | null;
  favourites?: number | null;
  genres?: string[];
  countryOfOrigin?: string | null;
  isAdult?: boolean;
  characters?: {
    edges?: Array<{
      role?: string | null;
      node?: { id: number; name?: { full?: string | null }; image?: { large?: string | null } } | null;
      voiceActors?: Array<{ id: number; name?: { full?: string | null }; image?: { large?: string | null } }> | null;
    }>;
  } | null;
  externalLinks?: Array<{
    id: number;
    site: string;
    url: string;
    type: string;
  }> | null;
};

type AniListResponse = {
  data?: { Page?: { media?: AniListMedia[] } };
  errors?: Array<{ message: string }>;
};

const LIST_QUERY = `
  query Catalog($page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: $sort) {
        id format status title { romaji english native } synonyms description
        coverImage { extraLarge large } bannerImage startDate { year month day }
        episodes duration averageScore popularity favourites genres countryOfOrigin isAdult
      }
    }
  }
`;

const DETAIL_QUERY = `
  query Detail($id: Int) {
    Media(id: $id, type: ANIME) {
      id format status title { romaji english native } synonyms description
      coverImage { extraLarge large } bannerImage startDate { year month day }
      episodes duration averageScore popularity favourites genres countryOfOrigin isAdult
      characters(sort: [ROLE, RELEVANCE], perPage: 15) {
        edges {
          role
          node { id name { full } image { large } }
          voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
            id name { full } image { large }
          }
        }
      }
      externalLinks {
        id site url type
      }
    }
  }
`;

export async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        next: { revalidate: 60 * 60 * 6 },
      });
      const body = (await response.json()) as T & { errors?: Array<{ message: string }> };
      if (!response.ok || body.errors?.length)
        throw new Error(
          body.errors?.[0]?.message ?? `AniList request failed (${response.status}).`,
        );
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < 2)
        await new Promise((resolve) => setTimeout(resolve, 350 * 2 ** attempt));
    }
  }
  throw new Error(
    `AniList request failed: ${lastError instanceof Error ? lastError.message : "network error"}`,
  );
}

function stripHtml(value?: string | null) {
  return (
    value
      ?.replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim() || null
  );
}

function mapFormat(format: AniListMedia["format"]): NormalizedMedia["mediaType"] {
  if (format === "MOVIE") return "ANIME_MOVIE";
  if (format === "OVA") return "OVA";
  if (format === "SPECIAL") return "SPECIAL";
  return "ANIME";
}

function mapStatus(status: AniListMedia["status"]): NormalizedMedia["status"] {
  if (status === "RELEASING") return "AIRING";
  if (status === "NOT_YET_RELEASED") return "UPCOMING";
  if (status === "CANCELLED") return "CANCELLED";
  return "FINISHED";
}

export function normalizeAniList(item: AniListMedia): NormalizedMedia {
  const date = item.startDate;
  const releaseDate = date?.year
    ? `${date.year}-${String(date.month ?? 1).padStart(2, "0")}-${String(date.day ?? 1).padStart(2, "0")}`
    : null;
  const title =
    item.title.english ?? item.title.romaji ?? item.title.native ?? "Untitled";
  const credits = (item.characters?.edges ?? [])
    .filter((edge) => edge.voiceActors?.[0])
    .map((edge) => {
      const va = edge.voiceActors![0];
      return {
        id: String(-va.id), // Negative ID ensures no collision with TMDb Int IDs
        name: va.name?.full ?? "Unknown",
        profileUrl: va.image?.large ?? null,
        role: "CAST" as const,
        character: edge.node?.name?.full ?? null,
        job: "Voice Actor", // The UI will check for this job string to display the badge
        department: "Cast",
      };
    });

  const platforms = (item.externalLinks ?? [])
    .filter((link) => link.type === "STREAMING")
    .map((link) => ({
      id: `anilist-p-${link.id}`,
      name: link.site,
      logoUrl: null, // AniList doesn't provide streaming logos easily
      region: "Global",
      watchUrl: link.url,
    }));

  return {
    source: "ANILIST",
    sourceId: String(item.id),
    title,
    originalTitle: item.title.native ?? item.title.romaji ?? null,
    alternativeTitles: [
      ...new Set(
        [
          item.title.romaji,
          item.title.english,
          item.title.native,
          ...(item.synonyms ?? []),
        ].filter(Boolean),
      ),
    ] as string[],
    description: stripHtml(item.description),
    posterUrl: item.coverImage?.extraLarge ?? item.coverImage?.large ?? null,
    backdropUrl: item.bannerImage ?? null,
    releaseDate,
    year: date?.year ?? null,
    runtime: item.duration ?? null,
    language: "JA",
    country: item.countryOfOrigin ?? "JP",
    mediaType: mapFormat(item.format),
    status: mapStatus(item.status),
    contentRating: item.isAdult ? "R" : null,
    averageRating: item.averageScore ?? null,
    voteCount: item.favourites ?? 0,
    popularity: Number(
      (
        ((item.popularity ?? 0) / 1000) * 0.5 +
        ((item.favourites ?? 0) / 100) * 0.5
      ).toFixed(2),
    ),
    seasonCount: null,
    episodeCount: item.episodes ?? null,
    genres: item.genres ?? [],
    credits,
    platforms,
  };
}

export async function fetchAniListCollection(page = 1) {
  const response = await anilistFetch<AniListResponse>(LIST_QUERY, {
    page,
    perPage: 50,
    sort: ["TRENDING_DESC", "POPULARITY_DESC"],
  });
  return (response.data?.Page?.media ?? []).map(normalizeAniList);
}

import { unstable_cache } from "next/cache";

export const fetchAniListDetails = unstable_cache(
  async (sourceId: string) => {
    const response = await anilistFetch<{ data?: { Media?: AniListMedia } }>(DETAIL_QUERY, {
      id: Number(sourceId),
    });
    if (!response.data?.Media) throw new Error("AniList title was not found.");
    return normalizeAniList(response.data.Media);
  },
  ["anilist-details"],
  { revalidate: 86400, tags: ["anilist"] }
);

const SEARCH_QUERY = `
  query Search($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME) {
        id format status title { romaji english native } synonyms description
        coverImage { extraLarge large } bannerImage startDate { year month day }
        episodes duration averageScore popularity favourites genres countryOfOrigin isAdult
      }
    }
  }
`;

export async function searchAniList(query: string): Promise<NormalizedMedia[]> {
  if (!query.trim()) return [];
  try {
    const response = await anilistFetch<AniListResponse>(SEARCH_QUERY, {
      search: query,
      page: 1,
      perPage: 10,
    });
    return (response.data?.Page?.media ?? []).map(normalizeAniList);
  } catch {
    return [];
  }
}

const DISCOVER_QUERY = `
  query Discover($genre: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(genre: $genre, type: ANIME, sort: [POPULARITY_DESC]) {
        id format status title { romaji english native } synonyms description
        coverImage { extraLarge large } bannerImage startDate { year month day }
        episodes duration averageScore popularity favourites genres countryOfOrigin isAdult
      }
    }
  }
`;

export async function fetchAniListDiscover(
  genreName?: string,
  page = 1,
): Promise<NormalizedMedia[]> {
  try {
    const response = await anilistFetch<AniListResponse>(DISCOVER_QUERY, {
      genre: genreName || undefined,
      page,
      perPage: 50,
    });
    return (response.data?.Page?.media ?? []).map(normalizeAniList);
  } catch {
    return [];
  }
}


