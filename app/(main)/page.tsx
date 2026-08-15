import { ContinueWatchingRow } from "@/components/home/continue-watching-row";
import { HomeHero } from "@/components/home/home-hero";
import { RecentActivityRow } from "@/components/home/recent-activity-row";
import { RecommendedRow } from "@/components/home/recommended-row";
import { TrendingNowRow } from "@/components/home/trending-now-row";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getExploreSections, getPersonalizedRecommendations } from "@/lib/media/queries";
import { getLibraryDashboard, getUserStats } from "@/lib/library/queries";

export default async function HomePage() {
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userMetadataName: string | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      userId = data.user.id;
      userEmail = data.user.email ?? null;
      userMetadataName = data.user.user_metadata?.display_name ?? null;
    }
  } catch {
    // Guest fallback
  }

  const [dbUser, stats, exploreSections, dashboard, personalizedRecommendations] = await Promise.all([
    userId
      ? prisma.user.findUnique({ where: { id: userId } }).catch(() => null)
      : Promise.resolve(null),
    userId
      ? getUserStats(userId).catch(() => ({
          totalWatched: 1,
          hoursWatched: 0,
          averageRating: 10.0,
          completionRate: 100,
          favoriteGenres: [{ name: "Drama", count: 1 }],
        }))
      : Promise.resolve({
          totalWatched: 1,
          hoursWatched: 0,
          averageRating: 10.0,
          completionRate: 100,
          favoriteGenres: [{ name: "Drama", count: 1 }],
        }),
    getExploreSections(),
    userId
      ? getLibraryDashboard(userId).catch(() => ({ items: [], wishlist: [] }))
      : Promise.resolve({ items: [], wishlist: [] }),
    getPersonalizedRecommendations(userId, 6).catch(() => []),
  ]);

  const userName =
    dbUser?.displayName ||
    userMetadataName ||
    userEmail?.split("@")[0] ||
    "S N Mallick";

  const watchingEntries = dashboard.items.filter((item) => item.status === "WATCHING");

  return (
    <div className="space-y-10">
      {/* Welcome Hero Section */}
      <HomeHero
        userName={userName}
        stats={stats}
        featuredPosters={exploreSections.trending}
      />

      {/* Continue Watching Section */}
      <ContinueWatchingRow
        userEntries={watchingEntries}
        fallbackItems={exploreSections.popularAnime}
      />

      {/* Trending Now Section */}
      <TrendingNowRow items={exploreSections.trending} />

      {/* Recommended For You Section with Match % */}
      <RecommendedRow
        items={
          personalizedRecommendations.length > 0
            ? personalizedRecommendations
            : exploreSections.topRated
        }
      />

      {/* Recent Activity Section */}
      <RecentActivityRow fallbackMedia={exploreSections.popularMovies} />
    </div>
  );
}
