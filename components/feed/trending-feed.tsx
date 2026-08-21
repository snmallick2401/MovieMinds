import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ActivityCard } from "./activity-card";

const getCachedTrendingActivities = unstable_cache(
  async () => {
    return prisma.activity
      .findMany({
        where: {
          type: { in: ["REVIEWED", "RATED", "COMPLETED", "FOLLOWED"] },
          user: { showActivity: true },
        },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          targetUser: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          media: { select: { id: true, title: true, posterUrl: true, mediaType: true } },
          review: { select: { id: true, body: true, spoiler: true } },
          rating: { select: { id: true, rating: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
      .catch(() => []);
  },
  ["trending-activities"],
  { revalidate: 300, tags: ["activity", "trending"] }
);

export async function TrendingFeed() {
  const activities = await getCachedTrendingActivities();

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold">No trending activity</h2>
        <p className="mt-2 text-muted-foreground">The community has been quiet lately.</p>
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
