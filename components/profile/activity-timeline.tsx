"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Star, CheckCircle2, PlayCircle, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingBadge } from "@/components/media/rating-badge";

type Activity = {
  id: string;
  type: "RATED" | "REVIEWED" | "COMPLETED" | "STARTED" | "WISHLISTED";
  createdAt: string;
  media: {
    id: string;
    slug?: string | null;
    title: string;
    posterUrl: string | null;
    year: number | null;
    mediaType: string;
  };
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  rating: number | null;
  review?: {
    title: string | null;
    spoiler: boolean;
  };
};

export function ActivityTimeline({ username }: { username: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchActivities = useCallback(async (cursor?: string) => {
    try {
      const url = new URL(`/api/users/${username}/activity`, window.location.origin);
      if (cursor) url.searchParams.set("cursor", cursor);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      setActivities(prev => cursor ? [...prev, ...data.items] : data.items);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  if (isLoading && activities.length === 0) {
    return <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>;
  }

  if (error && activities.length === 0) {
    return <p className="text-sm text-destructive">Could not load activity feed.</p>;
  }

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative border-l border-border pl-6 ml-3 space-y-8">
        {activities.map((activity) => (
          <div key={activity.id} className="relative">
            <span className="absolute -left-[37px] top-1 flex size-7 items-center justify-center rounded-full bg-background border border-border shadow-sm">
              {activity.type === "RATED" && <Star className="size-3.5 text-yellow-500" />}
              {activity.type === "REVIEWED" && <MessageSquare className="size-3.5 text-blue-500" />}
              {activity.type === "COMPLETED" && <CheckCircle2 className="size-3.5 text-green-500" />}
              {activity.type === "STARTED" && <PlayCircle className="size-3.5 text-primary" />}
              {activity.type === "WISHLISTED" && <Heart className="size-3.5 text-rose-500" />}
            </span>
            
            <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
              <div className="flex gap-4">
                <Link href={`/media/${activity.media.slug || activity.media.id}`} className="shrink-0">
                  {activity.media.posterUrl ? (
                    <Image
                      src={activity.media.posterUrl}
                      alt={activity.media.title}
                      width={48}
                      height={72}
                      className="rounded-md object-cover shadow-sm transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="h-[72px] w-[48px] rounded-md bg-muted" />
                  )}
                </Link>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">
                      {activity.user.displayName}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {activity.type === "RATED" && "rated"}
                      {activity.type === "REVIEWED" && "reviewed"}
                      {activity.type === "COMPLETED" && "completed"}
                      {activity.type === "STARTED" && "started watching"}
                      {activity.type === "WISHLISTED" && "added to wishlist"}
                    </span>{" "}
                    <Link href={`/media/${activity.media.slug || activity.media.id}`} className="font-semibold text-primary hover:underline">
                      {activity.media.title}
                    </Link>
                  </p>
                  
                  {activity.type === "RATED" && activity.rating && (
                    <div className="mt-2">
                      <RatingBadge rating={activity.rating} />
                    </div>
                  )}
                  
                  {activity.type === "REVIEWED" && activity.review && (
                    <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {activity.review.spoiler ? (
                        <span className="italic">Contains spoilers...</span>
                      ) : (
                        `"${activity.review.title || 'Review'}"`
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground pt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {nextCursor && (
        <Button 
          variant="outline" 
          className="w-full mt-4" 
          onClick={() => fetchActivities(nextCursor)}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  );
}
