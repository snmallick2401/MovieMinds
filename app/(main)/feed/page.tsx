import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { FeedList } from "@/components/feed/feed-list";
import { TrendingFeed } from "@/components/feed/trending-feed";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Activity Feed - MovieMinds",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // If not logged in, show trending feed
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Community Trends</h1>
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
          <TrendingFeed />
        </Suspense>
      </div>
    );
  }

  // Check if they follow anyone
  const followingCount = await prisma.follow.count({
    where: { followerId: user.id },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Activity Feed</h1>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
        {followingCount > 0 ? (
          <FeedList userId={user.id} />
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold">Your feed is quiet</h2>
              <p className="mt-2 text-muted-foreground">Follow people to see their reviews, ratings, and activities here.</p>
            </div>
            <h3 className="text-lg font-semibold mt-8 mb-4">Trending in the Community</h3>
            <TrendingFeed />
          </div>
        )}
      </Suspense>
    </div>
  );
}
