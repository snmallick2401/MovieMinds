import type {
  Media,
  MediaGenre,
  MediaPlatform,
  Genre,
  StreamingPlatform,
  Person,
  MediaPerson,
} from "@prisma/client";
import type { MediaDetail, MediaSummary } from "@/types/media";

export type MediaWithSummaryRelations = Media & {
  genres: Array<MediaGenre & { genre: Genre }>;
};

export type MediaWithDetailRelations = MediaWithSummaryRelations & {
  platforms: Array<MediaPlatform & { platform: StreamingPlatform }>;
  credits?: Array<MediaPerson & { person: Person }>;
};

export function serializeMediaSummary(media: MediaWithSummaryRelations): MediaSummary {
  return {
    id: media.id,
    source: media.source,
    sourceId: media.sourceId,
    title: media.title,
    originalTitle: media.originalTitle,
    posterUrl: media.posterUrl,
    releaseDate: media.releaseDate?.toISOString() ?? null,
    year: media.year,
    mediaType: media.mediaType,
    averageRating: media.averageRating,
    communityAverageRating: media.communityAverageRating
      ? Number(media.communityAverageRating)
      : null,
    ratingCount: media.ratingCount,
    weightedRating: media.weightedRating ? Number(media.weightedRating) : null,
    popularityScore: media.popularityScore,
    voteCount: media.voteCount,
    popularity: media.popularity,
    genres: media.genres.map(({ genre }) => ({ id: genre.id, name: genre.name })),
    sourceUpdatedAt: media.sourceUpdatedAt?.toISOString() ?? null,
    lastSyncedAt: media.lastSyncedAt?.toISOString() ?? null,
  };
}

export function serializeMediaDetail(media: MediaWithDetailRelations): MediaDetail {
  return {
    ...serializeMediaSummary(media),
    alternativeTitles: media.alternativeTitles,
    description: media.description,
    backdropUrl: media.backdropUrl,
    runtime: media.runtime,
    language: media.language,
    country: media.country,
    status: media.status,
    contentRating: media.contentRating,
    seasonCount: media.seasonCount,
    episodeCount: media.episodeCount,
    platforms: media.platforms.map(({ platform, region }) => ({
      id: platform.id,
      name: platform.name,
      logoUrl: platform.logoUrl,
      region,
    })),
    credits: (media.credits ?? []).map((credit) => ({
      id: credit.person.id,
      name: credit.person.name,
      profileUrl: credit.person.profileUrl,
      role: credit.role,
      character: credit.character,
      job: credit.job,
      department: credit.department,
    })),
  };
}

export function normalizedToSummary(media: import("@/types/media").NormalizedMedia): MediaSummary {
  return {
    id: `${media.source.toLowerCase()}-${media.sourceId}`,
    source: media.source,
    sourceId: media.sourceId,
    title: media.title,
    originalTitle: media.originalTitle,
    posterUrl: media.posterUrl,
    releaseDate: media.releaseDate,
    year: media.year,
    mediaType: media.mediaType,
    averageRating: media.averageRating,
    communityAverageRating: null,
    ratingCount: 0,
    weightedRating: null,
    popularityScore: 0,
    voteCount: media.voteCount,
    popularity: media.popularity,
    genres: media.genres.map((name, i) => ({ id: `ext-g-${i}`, name })),
    sourceUpdatedAt: media.sourceUpdatedAt?.toISOString() ?? null,
    lastSyncedAt: new Date().toISOString(),
  };
}

export function normalizedToDetail(media: import("@/types/media").NormalizedMedia): MediaDetail {
  return {
    ...normalizedToSummary(media),
    alternativeTitles: media.alternativeTitles,
    description: media.description,
    backdropUrl: media.backdropUrl,
    runtime: media.runtime,
    language: media.language,
    country: media.country,
    status: media.status,
    contentRating: media.contentRating,
    seasonCount: media.seasonCount,
    episodeCount: media.episodeCount,
    platforms: (media.platforms ?? []).map((p, i) => ({
      id: `ext-p-${i}`,
      name: p.name,
      logoUrl: p.logoUrl ?? null,
      region: p.region ?? null,
    })),
    credits: media.credits ?? [],
  };
}
