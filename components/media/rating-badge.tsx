import { DragonBall } from "@/components/icons/dragon-ball";

export function RatingBadge({ rating }: { rating: number | null }) {
  if (rating === null)
    return <span className="text-xs text-muted-foreground">Not rated</span>;

  // Map score to nearest Dragon Ball (1-7)
  const balls = Math.max(1, Math.min(7, Math.round(rating)));

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400">
      <DragonBall stars={balls} size={16} active />
      {rating.toFixed(1)}
    </span>
  );
}
