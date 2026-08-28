import type { NormalizedMedia } from "@/types/media";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";

type TmdbItem = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genre_names?: string[];
  genres?: Array<{ id: number; name: string }>;
  original_language?: string;
  origin_country?: string[];
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  credits?: {
    cast?: Array<{ id: number; name: string; profile_path?: string | null; character?: string; order?: number }>;
    crew?: Array<{ id: number; name: string; profile_path?: string | null; job?: string; department?: string }>;
  };
};

type TmdbResponse = { results: TmdbItem[] };
type TmdbGenreResponse = { genres: Array<{ id: number; name: string }> };
type TmdbProvidersResponse = {
  results?: Record<
    string,
    { flatrate?: Array<{ provider_name: string; logo_path?: string | null }> }
  >;
};

function tmdbUrl(path: string, size = "w500") {
  return path ? `${TMDB_IMAGE_URL}/${size}${path}` : null;
}

function mapStatus(status?: string): NormalizedMedia["status"] {
  if (["Planned", "In Production", "Post Production"].includes(status ?? ""))
    return "UPCOMING";
  if (["Returning Series", "In Production"].includes(status ?? "")) return "AIRING";
  if (status === "Canceled") return "CANCELLED";
  if (status === "Ended") return "FINISHED";
  return "RELEASED";
}

export async function tmdbFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not configured.");
  if (init?.signal?.aborted) throw new Error("Aborted");
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`,
      {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(2000),
        headers: {
          ...init?.headers,
          accept: "application/json",
          "user-agent": "MovieMinds/0.2",
        },
        next: { revalidate: 60 * 60 * 6 },
      }
    );
    if (!response.ok)
      throw new Error(`TMDb request failed (${response.status}) for ${path}.`);
    return response.json() as Promise<T>;
  } catch (error: any) {
    throw error;
  }
}


export async function getTmdbGenres(kind: "movie" | "tv", signal?: AbortSignal) {
  const response = await tmdbFetch<TmdbGenreResponse>(`/genre/${kind}/list`, { signal });
  return new Map(response.genres.map((genre) => [genre.id, genre.name]));
}


function normalizeTmdb(
  item: TmdbItem,
  kind: "movie" | "tv",
  genreMap: Map<number, string>,
): NormalizedMedia {
  const releaseDate = item.release_date ?? item.first_air_date;
  return {
    source: "TMDB",
    sourceId: String(item.id),
    title: item.title ?? item.name ?? "Untitled",
    originalTitle: item.original_title ?? item.original_name ?? null,
    alternativeTitles: [],
    description: item.overview?.trim() || null,
    posterUrl: tmdbUrl(item.poster_path ?? ""),
    backdropUrl: tmdbUrl(item.backdrop_path ?? "", "original"),
    releaseDate: releaseDate ?? null,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) || null : null,
    runtime: item.runtime ?? null,
    language: item.original_language?.toUpperCase() ?? null,
    country: item.origin_country?.[0] ?? null,
    mediaType: kind === "tv" ? "TV" : "MOVIE",
    status: mapStatus(item.status),
    contentRating: null,
    averageRating: item.vote_average ? Number(((item.vote_average / 10) * 7).toFixed(2)) : null,
    voteCount: item.vote_count ?? 0,
    popularity: Number(
      (
        (item.popularity ?? 0) * 0.6 +
        Math.log10(Math.max(1, item.vote_count ?? 0)) * 120
      ).toFixed(2),
    ),
    seasonCount: item.number_of_seasons ?? null,
    episodeCount: item.number_of_episodes ?? null,
    genres: (item.genres?.map(g => g.name) ??
      item.genre_names ??
      item.genre_ids?.map((id) => genreMap.get(id)).filter(Boolean) ??
      []) as string[],
  };
}

export async function fetchTmdbCollection(
  collection: "trending" | "popular" | "top_rated" | "upcoming",
  page = 1,
) {
  // Keep the initial catalog sync gentle on restrictive local networks and TMDb's edge.
  const movieGenres = await getTmdbGenres("movie");
  const tvGenres = await getTmdbGenres("tv");
  const moviePath =
    collection === "trending"
      ? `/trending/movie/week?page=${page}`
      : `/movie/${collection}?page=${page}`;
  const tvPath =
    collection === "trending"
      ? `/trending/tv/week?page=${page}`
      : `/tv/${collection === "upcoming" ? "on_the_air" : collection}?page=${page}`;
  const movies = await tmdbFetch<TmdbResponse>(moviePath);
  const tv = await tmdbFetch<TmdbResponse>(tvPath);
  return [
    ...movies.results.map((item) => normalizeTmdb(item, "movie", movieGenres)),
    ...tv.results.map((item) => normalizeTmdb(item, "tv", tvGenres)),
  ];
}

export async function fetchTmdbDetails(sourceId: string, type: "MOVIE" | "TV") {
  const kind = type === "TV" ? "tv" : "movie";
  const results = await Promise.allSettled([
    tmdbFetch<TmdbItem>(`/${kind}/${sourceId}?append_to_response=credits`),
    getTmdbGenres(kind),
    tmdbFetch<TmdbProvidersResponse>(`/${kind}/${sourceId}/watch/providers`),
  ]);

  if (results[0].status === "rejected") {
    throw results[0].reason; // The main item fetch failed, we must abort
  }
  const item = results[0].value;

  const genres = results[1].status === "fulfilled" ? results[1].value : new Map<number, string>();
  
  let providers = { results: {} } as TmdbProvidersResponse;
  if (results[2].status === "fulfilled") {
    providers = results[2].value;
  } else {
    console.warn(`Failed to fetch TMDb providers for ${kind} ${sourceId}:`, results[2].reason);
  }
  const normalized = normalizeTmdb(item, kind, genres);
  const regionalProviders = Object.values(providers.results ?? {}).flatMap(
    (region) =>
      region.flatrate?.map((provider) => ({
        name: provider.provider_name,
        logoUrl: provider.logo_path ? tmdbUrl(provider.logo_path, "w92") : null,
      })) ?? [],
  );
  normalized.platforms = [
    ...new Map(regionalProviders.map((provider) => [provider.name, provider])).values(),
  ];
  normalized.credits = [
    ...(item.credits?.cast?.slice(0, 15).map(c => ({
      id: String(c.id),
      name: c.name,
      profileUrl: tmdbUrl(c.profile_path ?? "", "w185"),
      role: "CAST" as const,
      character: c.character ?? null,
      job: null,
      department: null,
    })) ?? []),
    ...(item.credits?.crew?.filter(c => ["Director", "Writer", "Screenplay", "Executive Producer"].includes(c.job ?? "")).map(c => ({
      id: String(c.id),
      name: c.name,
      profileUrl: tmdbUrl(c.profile_path ?? "", "w185"),
      role: "CREW" as const,
      character: null,
      job: c.job ?? null,
      department: c.department ?? null,
    })) ?? [])
  ];
  return normalized;
}

export async function searchTmdb(query: string, signal?: AbortSignal): Promise<NormalizedMedia[]> {
  if (!query.trim()) return [];
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      getTmdbGenres("movie", signal).catch(() => new Map<number, string>()),
      getTmdbGenres("tv", signal).catch(() => new Map<number, string>()),
    ]);
    const response = await tmdbFetch<TmdbResponse & { results?: Array<TmdbItem & { media_type?: string }> }>(
      `/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
      { signal },
    );


    return (response.results ?? [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv" || !item.media_type)
      .slice(0, 10)
      .map((item) => {
        const kind = item.media_type === "tv" || (item.name && !item.title) ? "tv" : "movie";
        return normalizeTmdb(item, kind, kind === "tv" ? tvGenres : movieGenres);
      });
  } catch {
    return [];
  }
}

const TMDB_GENRE_IDS: Record<string, { movie?: number; tv?: number }> = {
  Action: { movie: 28, tv: 10759 },
  "Action & Adventure": { movie: 28, tv: 10759 },
  Adventure: { movie: 12, tv: 10759 },
  Animation: { movie: 16, tv: 16 },
  Comedy: { movie: 35, tv: 35 },
  Crime: { movie: 80, tv: 80 },
  Documentary: { movie: 99, tv: 99 },
  Drama: { movie: 18, tv: 18 },
  Family: { movie: 10751, tv: 10751 },
  Fantasy: { movie: 14, tv: 10765 },
  History: { movie: 36 },
  Horror: { movie: 27 },
  Kids: { tv: 10762 },
  Music: { movie: 10402 },
  Mystery: { movie: 9648, tv: 9648 },
  Romance: { movie: 10749 },
  "Sci-Fi": { movie: 878, tv: 10765 },
  "Sci-Fi & Fantasy": { movie: 878, tv: 10765 },
  "Science Fiction": { movie: 878, tv: 10765 },
  Thriller: { movie: 53 },
  War: { movie: 10752, tv: 10768 },
  "War & Politics": { movie: 10752, tv: 10768 },
  Western: { movie: 37, tv: 37 },
};

export async function fetchTmdbDiscover(
  genreName?: string,
  kind: "movie" | "tv" = "movie",
  page = 1,
): Promise<NormalizedMedia[]> {
  try {
    const genres = await getTmdbGenres(kind);
    let genreParam = "";
    if (genreName) {
      const mappedId = TMDB_GENRE_IDS[genreName]?.[kind];
      if (mappedId) {
        genreParam = `&with_genres=${mappedId}`;
      } else {
        const found = Array.from(genres.entries()).find(
          ([, name]) => name.toLowerCase() === genreName.toLowerCase(),
        );
        if (found) genreParam = `&with_genres=${found[0]}`;
      }
    }
    const response = await tmdbFetch<TmdbResponse>(
      `/discover/${kind}?page=${page}&sort_by=popularity.desc${genreParam}`,
    );
    return (response.results ?? []).map((item) => normalizeTmdb(item, kind, genres));
  } catch {
    return [];
  }
}


