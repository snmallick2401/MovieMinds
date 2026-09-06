"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, CheckCircle2, ChevronRight, MessageSquare, Star } from "lucide-react";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import type { MediaSummary } from "@/types/media";

type ActivityItem = {
  id: string;
  type: "RATED" | "COMPLETED" | "REVIEWED" | "WISHLIST";
  title: string;
  media: MediaSummary;
  rating?: number;
  timeAgo: string;
};

export function RecentActivityRow({
  userActivity,
  fallbackMedia,
}: {
  userActivity?: ActivityItem[];
  fallbackMedia: MediaSummary[];
}) {
  const displayActivities: ActivityItem[] =
    userActivity && userActivity.length > 0
      ? userActivity.slice(0, 4)
      : fallbackMedia.slice(0, 4).map((media, idx) => {
          const types: Array<ActivityItem["type"]> = [
            "RATED",
            "COMPLETED",
            "REVIEWED",
            "WISHLIST",
          ];
          const times = ["2h ago", "1 day ago", "3 days ago", "4 days ago"];
          return {
            id: media.id,
            type: types[idx % types.length],
            title: media.title,
            media,
            rating: 10.0,
            timeAgo: times[idx % times.length],
          };
        });

  if (displayActivities.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Recent activity
          </h2>
          <p className="text-xs text-muted-foreground">
            Your latest ratings, reviews, and updates.
          </p>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-1 text-xs font-semibold text-purple-400 transition-colors hover:underline"
        >
          View all activity
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayActivities.map((act) => {
          const isRated = act.type === "RATED";
          const isCompleted = act.type === "COMPLETED";
          const isReviewed = act.type === "REVIEWED";

          return (
            <div
              key={act.id}
              className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-purple-500/30"
            >
              {/* Media Thumbnail */}
              {act.media.posterUrl ? (
                <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-xl border border-border/60 shadow-md">
                  <Image
                    src={act.media.posterUrl}
                    alt={act.media.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[2/3] w-14 shrink-0 rounded-xl bg-muted" />
              )}

              {/* Event Info */}
              <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  {isRated && <Star className="size-3.5 text-purple-400 fill-purple-400" />}
                  {isCompleted && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                  {isReviewed && <MessageSquare className="size-3.5 text-blue-400" />}
                  {!isRated && !isCompleted && !isReviewed && (
                    <Bookmark className="size-3.5 text-amber-400" />
                  )}
                  <span>
                    {isRated
                      ? "You rated"
                      : isCompleted
                        ? "You completed"
                        : isReviewed
                          ? "You reviewed"
                          : "Added to wishlist"}
                  </span>
                </div>

                <Link
                  href={`/media/${act.media.slug || act.media.id}`}
                  className="truncate font-bold text-sm text-foreground hover:text-purple-400"
                >
                  {act.media.title}
                </Link>

                <p className="text-[11px] text-muted-foreground">
                  {MEDIA_TYPE_LABELS[act.media.mediaType]} · {act.media.year ?? "2024"}
                </p>

                <div className="flex items-center justify-between text-[11px] font-semibold">
                  {act.rating ? (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Star className="size-3 fill-purple-400" />
                      {act.rating.toFixed(1)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-muted-foreground/70">{act.timeAgo}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
