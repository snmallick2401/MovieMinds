import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { FeedList } from "@/components/feed/feed-list";
import { TrendingFeed } from "@/components/feed/trending-feed";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Activity Feed</h1>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
        <FeedList userId={user.id} />
      </Suspense>
    </div>
  );
}
