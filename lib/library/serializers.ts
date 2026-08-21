import type { Prisma } from "@prisma/client";
import type { LibraryEntry, WishlistEntry } from "@/types/library";

export const mediaForLibrary = {
  genres: { include: { genre: true } },
} satisfies Prisma.MediaInclude;

type StoredLibraryMedia = Omit<
  LibraryEntry["media"],
  | "releaseDate"
  | "genres"
  | "communityAverageRating"
  | "weightedRating"
  | "sourceUpdatedAt"
  | "lastSyncedAt"
> & {
  releaseDate: Date | null;
  genres: Array<{ genre: { id: string; name: string } }>;
  communityAverageRating: Prisma.Decimal | null;
  weightedRating: Prisma.Decimal | null;
  sourceUpdatedAt?: Date | null;
  lastSyncedAt?: Date | null;
};
type StoredWishlistMedia = Omit<
  WishlistEntry["media"],
  | "releaseDate"
  | "genres"
  | "communityAverageRating"
  | "weightedRating"
  | "sourceUpdatedAt"
  | "lastSyncedAt"
> & {
  releaseDate: Date | null;
  genres: Array<{ genre: { id: string; name: string } }>;
  communityAverageRating: Prisma.Decimal | null;
  weightedRating: Prisma.Decimal | null;
  sourceUpdatedAt?: Date | null;
  lastSyncedAt?: Date | null;
};
type StoredLibraryEntry = Omit<
  LibraryEntry,
  "startedAt" | "completedAt" | "createdAt" | "updatedAt" | "media" | "rating"
> & {
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  personalRating?: number | null;
  media: StoredLibraryMedia;
};
type StoredWishlistEntry = Omit<WishlistEntry, "createdAt" | "media"> & {
  createdAt: Date;
  media: StoredWishlistMedia;
};

export function serializeLibraryEntry(entry: StoredLibraryEntry): LibraryEntry {
  const { media } = entry;
  return {
    id: entry.id,
    status: entry.status,
    progress: entry.progress,
    completed: entry.completed,
    startedAt: entry.startedAt?.toISOString() ?? null,
    completedAt: entry.completedAt?.toISOString() ?? null,
    watchCount: entry.watchCount,
    favorite: entry.favorite,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    rating: entry.personalRating ?? null,
    media: {
      id: media.id,
      slug: media.slug ?? null,
      source: media.source,
      sourceId: media.sourceId,
      title: media.title,
      originalTitle: media.originalTitle,
      posterUrl: media.posterUrl,
      releaseDate: media.releaseDate?.toISOString() ?? null,
      year: media.year,
      mediaType: media.mediaType,
      averageRating: media.averageRating,
      communityAverageRating: media.communityAverageRating ? Number(media.communityAverageRating) : null,
      ratingCount: media.ratingCount,
      weightedRating: media.weightedRating ? Number(media.weightedRating) : null,
      popularityScore: media.popularityScore,
      voteCount: media.voteCount,
      popularity: media.popularity,
      episodeCount: media.episodeCount,
      runtime: media.runtime,
      genres: media.genres.map(({ genre }) => ({ id: genre.id, name: genre.name })),
      sourceUpdatedAt: media.sourceUpdatedAt?.toISOString() ?? null,
      lastSyncedAt: media.lastSyncedAt?.toISOString() ?? null,
    },
  };
}

export function serializeWishlistEntry(entry: StoredWishlistEntry): WishlistEntry {
  const { media } = entry;
  return {
    id: entry.id,
    priority: entry.priority,
    note: entry.note,
    position: entry.position,
    createdAt: entry.createdAt.toISOString(),
    media: {
      id: media.id,
      slug: media.slug ?? null,
      source: media.source,
      sourceId: media.sourceId,
      title: media.title,
      originalTitle: media.originalTitle,
      posterUrl: media.posterUrl,
      releaseDate: media.releaseDate?.toISOString() ?? null,
      year: media.year,
      mediaType: media.mediaType,
      averageRating: media.averageRating,
      communityAverageRating: media.communityAverageRating ? Number(media.communityAverageRating) : null,
      ratingCount: media.ratingCount,
      weightedRating: media.weightedRating ? Number(media.weightedRating) : null,
      popularityScore: media.popularityScore,
      voteCount: media.voteCount,
      popularity: media.popularity,
      genres: media.genres.map(({ genre }) => ({ id: genre.id, name: genre.name })),
      sourceUpdatedAt: media.sourceUpdatedAt?.toISOString() ?? null,
      lastSyncedAt: media.lastSyncedAt?.toISOString() ?? null,
    },
  };
}
