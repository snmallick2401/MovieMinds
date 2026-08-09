import { PlayCircle, Sparkles } from "lucide-react";
import { MediaSection } from "@/components/home/media-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = user?.user_metadata.display_name || user?.email?.split("@")[0] || "there";
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/25 via-card to-card p-6 sm:p-9">
        <Sparkles className="mb-4 size-6 text-primary" />
        <p className="text-sm font-medium text-primary">YOUR NEXT GREAT STORY</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back, {name}.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Build your watchlist, keep track of every story, and find your next obsession in
          one thoughtful place.
        </p>
        <Button className="mt-6" disabled>
          <PlayCircle className="size-4" />
          Start exploring
        </Button>
      </section>
      <MediaSection
        title="Continue watching"
        description="Pick up where you left off."
        action="View library"
      />
      <MediaSection
        title="Trending now"
        description="Popular with the MovieMinds community."
        action="Explore"
      />
      <MediaSection
        title="Recommended for you"
        description="Personalized recommendations will appear here as you build your taste profile."
      />
      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
        <Card className="p-6 text-center">
          <p className="font-medium">Your activity will live here.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rate something you’ve watched to begin your MovieMinds journey.
          </p>
        </Card>
      </section>
    </div>
  );
}
