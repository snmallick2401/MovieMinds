import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import type { LibraryEntry } from "@/types/library";

export function RecentActivityCard({ recentEntry }: { recentEntry?: LibraryEntry | null }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
          <Link href="/library" className="text-xs font-semibold text-purple-400 hover:underline">
            View all
          </Link>
        </div>

        {recentEntry ? (
          <div className="mt-5 flex gap-4 rounded-xl border border-border/60 bg-background/50 p-3.5 backdrop-blur">
            {recentEntry.media.posterUrl ? (
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 shadow-md">
                <Image
                  src={recentEntry.media.posterUrl}
                  alt={recentEntry.media.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[2/3] w-16 shrink-0 rounded-lg bg-muted" />
            )}
            <div className="flex flex-col justify-between py-0.5">
              <div>
                <Link
                  href={`/media/${recentEntry.media.id}`}
                  className="font-bold text-foreground hover:text-purple-400 line-clamp-1 text-sm"
                >
                  {recentEntry.media.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {MEDIA_TYPE_LABELS[recentEntry.media.mediaType]} ·{" "}
                  <span className="capitalize text-emerald-400 font-medium">
                    {recentEntry.status.toLowerCase().replace(/_/g, " ")}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {recentEntry.rating ? (
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <Star className="size-3.5 fill-amber-400" />
                    Rated {recentEntry.rating.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Recently updated</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
            No recent activity recorded yet. Start watching or rating titles!
          </div>
        )}
      </div>

      <div className="mt-5">
        <Link
          href="/library"
          className="flex w-full items-center justify-center rounded-xl border border-border/80 bg-background/50 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60"
        >
          View all activity
        </Link>
      </div>
    </div>
  );
}
