import { revalidateTag } from "next/cache";

export const CATALOG_REVALIDATE_SECONDS = 60 * 15;

export function isStale(lastSyncedAt: Date, maxAgeSeconds = CATALOG_REVALIDATE_SECONDS) {
  return Date.now() - lastSyncedAt.getTime() > maxAgeSeconds * 1000;
}

export function invalidateCatalogCache() {
  revalidateTag("catalog");
}
