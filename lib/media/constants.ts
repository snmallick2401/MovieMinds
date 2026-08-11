import type { MediaStatus, MediaType } from "@/types/media";

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  MOVIE: "Movie",
  TV: "TV series",
  ANIME: "Anime series",
  ANIME_MOVIE: "Anime movie",
  OVA: "OVA",
  DOCUMENTARY: "Documentary",
  SPECIAL: "Special",
};

export const MEDIA_STATUS_LABELS: Record<MediaStatus, string> = {
  RELEASED: "Released",
  UPCOMING: "Upcoming",
  AIRING: "Airing",
  FINISHED: "Finished",
  CANCELLED: "Cancelled",
};

export const CONTENT_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "TV-14", "TV-MA"];
export const FEATURED_PLATFORMS = [
  "Netflix",
  "Crunchyroll",
  "Prime Video",
  "Disney+",
  "Apple TV",
  "Hulu",
];
