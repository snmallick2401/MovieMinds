import { SearchX } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaSummary } from "@/types/media";

export function MediaGrid({
  items,
  emptyMessage = "No titles match these filters.",
}: {
  items: MediaSummary[];
  emptyMessage?: string;
}) {
  if (!items.length)
    return (
      <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <div>
          <SearchX className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nothing to show yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((media, index) => (
        <MediaCard key={media.id} media={media} priority={index < 2} />
      ))}
    </div>
  );
}

export function MediaGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="aspect-[2/3] rounded-xl" />
      ))}
    </div>
  );
}
