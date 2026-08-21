/**
 * Slug generation utilities for SEO-friendly media URLs.
 * Produces clean, URL-safe slugs like "spider-man-brand-new-day-2007".
 */

/**
 * Convert a title string into a URL-safe slug.
 * - Lowercases everything
 * - Strips punctuation and special characters
 * - Collapses spaces/hyphens into single hyphens
 * - Trims leading/trailing hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    // Normalize unicode (e.g. accented chars) to ASCII equivalents
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Replace & with "and"
    .replace(/&/g, "and")
    // Remove apostrophes / single quotes (so "don't" -> "dont")
    .replace(/[''']/g, "")
    // Replace non-alphanumeric characters (except hyphens) with a space
    .replace(/[^a-z0-9\-]/g, " ")
    // Collapse multiple spaces/hyphens into a single hyphen
    .replace(/[\s\-]+/g, "-")
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug for a media item, given its title, year, and sourceId.
 * Strategy:
 *  1. `{title-slug}`
 *  2. `{title-slug}-{year}` if a collision exists
 *  3. `{title-slug}-{year}-{4-char-hash}` if still a collision
 */
export function generateSlugCandidates(
  title: string,
  year: number | null,
  sourceId: string
): string[] {
  const base = slugify(title) || "untitled";
  const candidates: string[] = [base];

  if (year) {
    candidates.push(`${base}-${year}`);
  }

  // Short deterministic suffix from sourceId (4 chars)
  const hash = sourceId
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(-4)
    .padStart(4, "x");

  candidates.push(year ? `${base}-${year}-${hash}` : `${base}-${hash}`);

  return candidates;
}
