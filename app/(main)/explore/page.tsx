import { Suspense } from "react";
import { ActiveFilters } from "@/components/filters/active-filters";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { CategoryPills } from "@/components/explore/category-pills";
import { ExploreHeader } from "@/components/explore/explore-header";
import { ExploreHero } from "@/components/explore/explore-hero";
import { CatalogPagination } from "@/components/explore/pagination";
import { MediaGrid, MediaGridSkeleton } from "@/components/media/media-grid";
import { MediaRow } from "@/components/media/media-row";
import { parseMediaFilters } from "@/lib/media/filters";
import { findMedia, getExploreSections, getGenres } from "@/lib/media/queries";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function asSearchParams(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") params.set(key, value);
    if (Array.isArray(value)) params.set(key, value.join(","));
  }
  return params;
}

async function CatalogResults({ params }: { params: URLSearchParams }) {
  const filters = parseMediaFilters(params);
  const [{ items, total, page, totalPages }, genres] = await Promise.all([
    findMedia(filters),
    getGenres(),
  ]);
  const hasFilters = Array.from(params.keys()).some(
    (key) => !["page", "sort"].includes(key),
  );

  return (
    <div className="mt-8 flex gap-7">
      {/* Redesigned Filter Sidebar */}
      <FilterSidebar genres={genres} />

      {/* Results & Grid Section */}
      <div className="min-w-0 flex-1">
        <ExploreHeader
          total={total}
          sortValue={filters.sort ?? "popular"}
          genres={genres}
        />

        <ActiveFilters />

        <div className="mt-5">
          <MediaGrid
            items={items}
            emptyMessage={
              hasFilters
                ? "Try removing one or two filters, or search for a different title."
                : "Your local catalog is empty. Search for titles above to start populating your collection."
            }
          />
        </div>

        {/* Modern Pagination Controls */}
        {totalPages > 1 && (
          <CatalogPagination page={page} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
}

async function DiscoveryRows() {
  const sections = await getExploreSections();
  return (
    <div className="mt-14 space-y-12">
      <MediaRow
        title="Trending now"
        description="The titles drawing the most attention right now."
        items={sections.trending}
      />
      <MediaRow
        title="Popular movies"
        description="Big-screen stories worth making time for."
        items={sections.popularMovies}
        href="/explore?type=MOVIE"
      />
      <MediaRow
        title="Popular anime"
        description="Highly loved anime from every era."
        items={sections.popularAnime}
        href="/explore?type=ANIME,ANIME_MOVIE,OVA"
      />
      <MediaRow
        title="Top rated"
        description="Standouts chosen by audiences."
        items={sections.topRated}
        href="/explore?sort=rating"
      />
      <MediaRow
        title="New releases"
        description="The newest additions to the catalog."
        items={sections.newReleases}
        href="/explore?sort=newest"
      />
      <MediaRow
        title="Upcoming"
        description="Keep these on your radar."
        items={sections.upcoming}
        href="/explore?status=UPCOMING"
      />
    </div>
  );
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const params = asSearchParams(await searchParams);
  const sections = await getExploreSections();

  return (
    <div className="space-y-6">
      {/* Redesigned Explore Hero Banner */}
      <ExploreHero featuredPosters={sections.trending} />

      {/* Popular right now Category Pills */}
      <CategoryPills />

      {/* Main Catalog Grid & Filters */}
      <Suspense
        fallback={
          <div className="mt-8">
            <MediaGridSkeleton />
          </div>
        }
      >
        <CatalogResults params={params} />
      </Suspense>

      {/* Discovery Rows for Default Catalog */}
      {!Array.from(params.keys()).length && (
        <Suspense fallback={null}>
          <DiscoveryRows />
        </Suspense>
      )}
    </div>
  );
}
