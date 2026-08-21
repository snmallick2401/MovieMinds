import { Flame, Users } from "lucide-react";
import { RatingHistogram } from "@/components/ratings/rating-histogram";
import { DragonBall } from "@/components/icons/dragon-ball";
import type { MediaRatingSummary } from "@/types/rating";

export function AverageRatingCard({ summary }: { summary: MediaRatingSummary }) {
  const avg = summary.communityAverageRating;
  const dragonBalls = avg ? Math.max(1, Math.min(7, Math.round(avg))) : 4;

  return (
    <section className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-400/10 via-card to-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Member Score</p>
          <p className="mt-1 text-4xl font-black tracking-tight">
            {avg?.toFixed(1) ?? "—"}
            <span className="ml-1 text-base font-medium text-muted-foreground">/ 7</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="size-4" />
            {summary.ratingCount.toLocaleString()} ratings
          </p>
        </div>
        <DragonBall stars={dragonBalls} size={52} active />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-border/70 py-4 text-sm">
        <div>
          <p className="text-muted-foreground">Weighted score</p>
          <p className="mt-1 font-bold">{summary.weightedRating?.toFixed(2) ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Popularity</p>
          <p className="mt-1 flex items-center gap-1 font-bold">
            <Flame className="size-4 text-primary" />
            {summary.popularityScore.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <RatingHistogram distribution={summary.ratingDistribution} />
      </div>
    </section>
  );
}
