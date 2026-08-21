import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Eye, MessageSquare } from "lucide-react";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import { RatingBadge } from "@/components/media/rating-badge";
import { formatJoinDate } from "@/lib/utils";

type ReviewItem = {
  id: string;
  title: string | null;
  body: string;
  spoiler: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: Date;
  media: {
    id: string;
    slug: string | null;
    title: string;
    mediaType:
      "MOVIE" | "TV" | "ANIME" | "ANIME_MOVIE" | "OVA" | "DOCUMENTARY" | "SPECIAL";
    year: number | null;
    posterUrl: string | null;
    averageRating: number | null;
  };
};

export function RecentlyReviewedCard({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Recently Reviewed</h2>
        <Link
          href="/library"
          className="text-xs font-semibold text-purple-400 hover:underline"
        >
          View all reviews
        </Link>
      </div>

      {reviews.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <div
              key={review.id}
              className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/50 p-4 transition-all hover:border-purple-500/30"
            >
              <div>
                <div className="flex gap-3">
                  {review.media.posterUrl ? (
                    <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md border border-border/60">
                      <Image
                        src={review.media.posterUrl}
                        alt={review.media.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/3] w-12 shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        href={`/media/${review.media.slug ?? review.media.id}`}
                        className="truncate text-sm font-bold text-foreground hover:text-purple-400"
                      >
                        {review.media.title}
                      </Link>
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {MEDIA_TYPE_LABELS[review.media.mediaType]} ·{" "}
                      {review.media.year ?? "TBA"}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <RatingBadge rating={review.media.averageRating} />
                    </div>
                  </div>
                </div>

                <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {review.spoiler ? "⚠️ Contains spoilers" : review.body}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                <span>{formatJoinDate(review.createdAt)}</span>
                <span className="flex items-center gap-1 font-medium capitalize">
                  <Eye className="size-3" />
                  {review.visibility.toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
          You haven&apos;t written any reviews yet. Share your thoughts on titles
          you&apos;ve watched!
        </div>
      )}
    </div>
  );
}
