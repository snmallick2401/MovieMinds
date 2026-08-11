import { Star } from "lucide-react";

export function RatingBadge({ rating }: { rating: number | null }) {
  if (rating === null)
    return <span className="text-xs text-muted-foreground">Not rated</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
      <Star className="size-3 fill-current" aria-hidden="true" />
      {rating.toFixed(1)}
    </span>
  );
}
