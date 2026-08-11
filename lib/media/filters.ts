import {
  mediaStatuses,
  mediaTypes,
  type MediaFilters,
  type MediaStatus,
  type MediaType,
} from "@/types/media";

const SORT_VALUES = ["popular", "rating", "newest", "recent"] as const;

function list(value: string | null) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function number(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseMediaFilters(searchParams: URLSearchParams): MediaFilters {
  const types = list(searchParams.get("type")).filter((type): type is MediaType =>
    mediaTypes.includes(type as MediaType),
  );
  const statuses = list(searchParams.get("status")).filter(
    (status): status is MediaStatus => mediaStatuses.includes(status as MediaStatus),
  );
  const runtime = searchParams.get("runtime");
  const sort = searchParams.get("sort");
  const page = number(searchParams.get("page"));
  const pageSize = number(searchParams.get("pageSize"));
  return {
    query: searchParams.get("q")?.trim() || undefined,
    genres: list(searchParams.get("genre")),
    types,
    languages: list(searchParams.get("language")),
    countries: list(searchParams.get("country")),
    platforms: list(searchParams.get("platform")),
    ratings: list(searchParams.get("rating")),
    statuses,
    yearFrom: number(searchParams.get("yearFrom")),
    yearTo: number(searchParams.get("yearTo")),
    runtime:
      runtime === "under-90" ||
      runtime === "90-120" ||
      runtime === "120-150" ||
      runtime === "over-150"
        ? runtime
        : undefined,
    minRating: number(searchParams.get("minRating")),
    sort: SORT_VALUES.includes(sort as (typeof SORT_VALUES)[number])
      ? (sort as (typeof SORT_VALUES)[number])
      : "popular",
    page: page && page > 0 ? Math.floor(page) : 1,
    pageSize: pageSize && pageSize > 0 ? Math.min(Math.floor(pageSize), 48) : 24,
  };
}

export function filtersToSearchParams(filters: MediaFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.genres?.length) params.set("genre", filters.genres.join(","));
  if (filters.types?.length) params.set("type", filters.types.join(","));
  if (filters.languages?.length) params.set("language", filters.languages.join(","));
  if (filters.countries?.length) params.set("country", filters.countries.join(","));
  if (filters.platforms?.length) params.set("platform", filters.platforms.join(","));
  if (filters.ratings?.length) params.set("rating", filters.ratings.join(","));
  if (filters.statuses?.length) params.set("status", filters.statuses.join(","));
  if (filters.yearFrom) params.set("yearFrom", String(filters.yearFrom));
  if (filters.yearTo) params.set("yearTo", String(filters.yearTo));
  if (filters.runtime) params.set("runtime", filters.runtime);
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.sort && filters.sort !== "popular") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params;
}
