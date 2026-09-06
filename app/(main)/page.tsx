import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import { ContinueWatchingRow } from "@/components/home/continue-watching-row";
import { HomeHero } from "@/components/home/home-hero";
import { RecentActivityRow } from "@/components/home/recent-activity-row";
import { RecommendedRow } from "@/components/home/recommended-row";
import { TrendingNowRow } from "@/components/home/trending-now-row";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getExploreSections, getPersonalizedRecommendations } from "@/lib/media/queries";
import { getLibraryDashboard, getUserStats } from "@/lib/library/queries";
import { getOrCreateProfile } from "@/lib/profile";

export default async function HomePage() {
  const t0 = performance.now();
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

  const tAuth = performance.now();

  const [dbUser, stats, exploreSections, dashboard, personalizedRecommendations, rawActivities] = await Promise.all([
    userId
      ? getOrCreateProfile({
          id: userId,
          email: userEmail,
          user_metadata: { display_name: userMetadataName },
        }).catch(() => null)
      : Promise.resolve(null),
    userId
      ? getUserStats(userId)
      : Promise.resolve({
          totalWatched: 1,
          hoursWatched: 0,
          averageRating: 7.0,
          completionRate: 100,
          favoriteGenres: [{ name: "Drama", count: 1 }],
        }),
    getExploreSections(),
    userId
      ? getLibraryDashboard(userId)
      : Promise.resolve({ items: [], wishlist: [] }),
    getPersonalizedRecommendations(userId, 6),
    prisma.activity.findMany({
      where: userId ? { userId } : undefined,
      include: {
        media: {
          select: {
            id: true,
            slug: true,
            title: true,
            posterUrl: true,
            mediaType: true,
            year: true,
          },
        },
        rating: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }).catch(() => []),
  ]);

  const tDataLoaded = performance.now();

  console.log(JSON.stringify({
    level: "info",
    tag: "TIMING_HOMEPAGE",
    authMs: Math.round(tAuth - t0),
    dataMs: Math.round(tDataLoaded - tAuth),
    totalPageMs: Math.round(tDataLoaded - t0),
  }));

  const isLoggedIn = Boolean(userId);
  const userName = isLoggedIn
    ? dbUser?.displayName || userMetadataName || userEmail?.split("@")[0] || null
    : null;

  const watchingEntries = dashboard.items.filter((item) => item.status === "WATCHING");

  const heroPosters =
    exploreSections.trending?.length > 0
      ? exploreSections.trending
      : personalizedRecommendations?.length > 0
        ? personalizedRecommendations
        : exploreSections.topRated || [];

  const trendingItems =
    exploreSections.trending?.length > 0
      ? exploreSections.trending
      : exploreSections.popularMovies?.length > 0
        ? exploreSections.popularMovies
        : personalizedRecommendations;

  const continueWatchingFallback =
    exploreSections.popularAnime?.length > 0
      ? exploreSections.popularAnime
      : trendingItems;

  const activityFallback =
    exploreSections.popularMovies?.length > 0
      ? exploreSections.popularMovies
      : trendingItems;

  const formattedUserActivity = rawActivities.map((act) => ({
    id: act.id,
    type: act.type as any,
    title: act.media?.title || "Media",
    media: act.media ? {
      id: act.media.id,
      slug: act.media.slug ?? null,
      title: act.media.title,
      posterUrl: act.media.posterUrl,
      mediaType: act.media.mediaType,
      year: act.media.year,
      averageRating: act.rating ? Number(act.rating.rating) : null,
    } as any : null,
    rating: act.rating ? Number(act.rating.rating) : undefined,
    timeAgo: formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }),
  })).filter((a) => a.media !== null);

  return (
    <div className="space-y-10">
      {/* Welcome / Landing Hero Section */}
      <HomeHero
        userName={userName}
        isLoggedIn={isLoggedIn}
        stats={isLoggedIn ? stats : undefined}
        featuredPosters={heroPosters}
      />

      {/* Continue Watching Section */}
      <ContinueWatchingRow
        userEntries={watchingEntries}
        fallbackItems={continueWatchingFallback}
      />

      {/* Trending Now Section */}
      <TrendingNowRow items={trendingItems} />

      {/* Recommended For You Section with Match % */}
      <RecommendedRow
        items={
          personalizedRecommendations.length > 0
            ? personalizedRecommendations
            : exploreSections.topRated
        }
      />

      {/* Recent Activity Section */}
      <RecentActivityRow
        userActivity={formattedUserActivity.length > 0 ? formattedUserActivity : undefined}
        fallbackMedia={activityFallback}
      />

      {/* Latest News Section */}
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
        <HomeNewsSection />
      </Suspense>
    </div>
  );
}

import { getLatestNews } from "@/lib/news/queries";
import { NewsCarousel } from "@/components/news/news-carousel";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

async function HomeNewsSection() {
  const articles = await getLatestNews(12);
  
  if (!articles.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Latest Anime News</h2>
        <Link href="/news" className="flex items-center text-sm font-semibold text-primary hover:underline">
          View All <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <NewsCarousel articles={articles} />
    </section>
  );
}
