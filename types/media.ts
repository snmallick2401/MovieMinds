export const mediaSources = ["TMDB", "ANILIST"] as const;
export const mediaTypes = [
  "MOVIE",
  "TV",
  "ANIME",
  "ANIME_MOVIE",
  "OVA",
  "DOCUMENTARY",
  "SPECIAL",
] as const;
export const mediaStatuses = [
  "RELEASED",
  "UPCOMING",
  "AIRING",
  "FINISHED",
  "CANCELLED",
] as const;

export type MediaSource = (typeof mediaSources)[number];
export type MediaType = (typeof mediaTypes)[number];
export type MediaStatus = (typeof mediaStatuses)[number];

export type MediaGenre = { id: string; name: string };
export type MediaPlatform = {
  id: string;
  name: string;
  logoUrl: string | null;
  region: string | null;
};

export type MediaSummary = {
  id: string;
  source: MediaSource;
  sourceId: string;
  title: string;
  originalTitle: string | null;
  posterUrl: string | null;
  releaseDate: string | null;
  year: number | null;
  mediaType: MediaType;
  averageRating: number | null;
  communityAverageRating: number | null;
  ratingCount: number;
  weightedRating: number | null;
  popularityScore: number;
  voteCount: number;
  popularity: number;
  genres: MediaGenre[];
  sourceUpdatedAt: string | null;
  lastSyncedAt: string | null;
};

export type MediaCredit = {
  id: string; // tmdbId or cuid
  name: string;
  profileUrl: string | null;
  role: "CAST" | "CREW";
  character: string | null;
  job: string | null;
  department: string | null;
};

export type MediaDetail = MediaSummary & {
  alternativeTitles: string[];
  description: string | null;
  backdropUrl: string | null;
  runtime: number | null;
  language: string | null;
  country: string | null;
  status: MediaStatus;
  contentRating: string | null;
  seasonCount: number | null;
  episodeCount: number | null;
  platforms: MediaPlatform[];
  credits: MediaCredit[];
};

export type MediaFilters = {
  query?: string;
  genres?: string[];
  types?: MediaType[];
  languages?: string[];
  countries?: string[];
  platforms?: string[];
  ratings?: string[];
  statuses?: MediaStatus[];
  yearFrom?: number;
  yearTo?: number;
  runtime?: "under-90" | "90-120" | "120-150" | "over-150";
  minRating?: number;
  sort?: "popular" | "rating" | "newest" | "recent";
  page?: number;
  pageSize?: number;
};

export type PaginatedMedia = {
  items: MediaSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type NormalizedMedia = Omit<MediaDetail, "id" | "genres" | "platforms" | "communityAverageRating" | "ratingCount" | "weightedRating" | "popularityScore" | "credits"> & {
  sourceUpdatedAt?: Date;
  genres: string[];
  platforms?: Array<{
    name: string;
    logoUrl?: string | null;
    region?: string | null;
    watchUrl?: string | null;
  }>;
  credits?: MediaCredit[];
};
