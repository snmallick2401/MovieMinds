import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { GenreBadge } from "@/components/media/genre-badge";
import { RatingBadge } from "@/components/media/rating-badge";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import type { MediaSummary } from "@/types/media";

export function MediaCard({
  media,
  priority = false,
}: {
  media: MediaSummary;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/media/${media.slug ?? media.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Open ${media.title}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {media.posterUrl ? (
          <Image
            src={media.posterUrl}
            alt={`${media.title} poster`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="size-7" aria-hidden="true" />
            <span className="sr-only">No poster available</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
          {MEDIA_TYPE_LABELS[media.mediaType]}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-1 font-semibold leading-tight">{media.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{media.year ?? "TBA"}</span>
          <RatingBadge rating={media.averageRating} />
        </div>
        {media.genres[0] && <GenreBadge name={media.genres[0].name} />}
      </div>
    </Link>
  );
}
