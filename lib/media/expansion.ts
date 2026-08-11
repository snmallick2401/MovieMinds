import { fetchAniListDiscover } from "@/lib/anilist/client";
import { invalidateCatalogCache } from "@/lib/cache/catalog";
import { fetchTmdbDiscover } from "@/lib/tmdb/client";
import { upsertMedia } from "@/lib/media/sync";
import type { MediaFilters, NormalizedMedia } from "@/types/media";

const ongoingExpansions = new Set<string>();

/**
 * Automatically persists external search results into the database in the background.
 * Grows the local catalog automatically with every search query!
 */
export async function autoPersistSearchResults(mediaItems: NormalizedMedia[]) {
  if (!mediaItems.length) return;
  // Fire-and-forget background persistence
  (async () => {
    for (const item of mediaItems) {
      try {
        await upsertMedia(item);
      } catch {
        // Ignore individual upsert errors during search background auto-ingestion
      }
    }
    invalidateCatalogCache();
  })();
}

/**
 * Automatically expands the catalog for any filter if matching titles in DB < 800.
 * Fetches movies, TV shows, and anime from TMDb and AniList for that specific filter/genre,
 * upserting them into PostgreSQL so every filter grows to 800+ titles!
 */
export function autoExpandFilterCatalog(filters: MediaFilters, currentTotal: number) {
  if (currentTotal >= 800) return;

  const genre = filters.genres?.[0];
  const type = filters.types?.[0];
  const expansionKey = `genre:${genre ?? "all"}-type:${type ?? "all"}`;

  if (ongoingExpansions.has(expansionKey)) return;
  ongoingExpansions.add(expansionKey);

  // Run in background without blocking response
  (async () => {
    try {
      let newlyImported = 0;
      for (let page = 1; page <= 8; page++) {
        const tmdbMovies =
          !type || type === "MOVIE"
            ? await fetchTmdbDiscover(genre, "movie", page)
            : [];
        const tmdbTv =
          !type || type === "TV"
            ? await fetchTmdbDiscover(genre, "tv", page)
            : [];
        const anilist =
          !type ||
          type === "ANIME" ||
          type === "ANIME_MOVIE" ||
          type === "OVA" ||
          type === "SPECIAL"
            ? await fetchAniListDiscover(genre, page)
            : [];

        const batch = [...tmdbMovies, ...tmdbTv, ...anilist];
        if (!batch.length) break;

        for (const item of batch) {
          try {
            await upsertMedia(item);
            newlyImported++;
          } catch {
            // Ignore single item upsert collision
          }
        }

        if (currentTotal + newlyImported >= 800 || page >= 8) break;
      }
      if (newlyImported > 0) {
        invalidateCatalogCache();
      }
    } catch (err) {
      console.error("Filter expansion error:", err);
    } finally {
      ongoingExpansions.delete(expansionKey);
    }
  })();
}
