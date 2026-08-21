import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ActivityCard } from "./activity-card";
import { TrendingFeed } from "./trending-feed";

const getCachedPersonalFeed = unstable_cache(
  async (userId: string) => {
    const follows = await prisma.follow
      .findMany({
        where: { followerId: userId },
        select: { followingId: true },
      })
      .catch(() => []);

    const followingIds = follows.map((f) => f.followingId);
    const followsCount = follows.length;

    // Add own ID to see their own activities
    followingIds.push(userId);

    const activities = await prisma.activity
      .findMany({
        where: {
          userId: { in: followingIds },
        },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          targetUser: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          media: { select: { id: true, title: true, posterUrl: true, mediaType: true } },
          review: { select: { id: true, body: true, spoiler: true } },
          rating: { select: { id: true, rating: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      .catch(() => []);

    return { activities, followsCount };
  },
  ["personal-feed"],
  { revalidate: 60, tags: ["activity", "feed"] }
);

export async function FeedList({ userId }: { userId: string }) {
  const { activities, followsCount } = await getCachedPersonalFeed(userId);

  if (activities.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold">{followsCount === 0 ? "Your feed is quiet" : "No recent activity"}</h2>
          <p className="mt-2 text-muted-foreground">{followsCount === 0 ? "Follow people to see their reviews, ratings, and activities here." : "The people you follow haven't been active recently."}</p>
        </div>
        <h3 className="text-lg font-semibold mt-8 mb-4">Trending in the Community</h3>
        <TrendingFeed />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
