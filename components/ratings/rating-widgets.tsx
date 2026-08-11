import { BarChart3, Star, Trophy } from "lucide-react";
import type { RatingStatsData } from "@/components/stats/stats-charts";

export function RatingWidgets({ stats }: { stats: RatingStatsData }) {
  const topGenre = stats.genreAverages[0]?.name ?? "None";
  const topGenreAvg = stats.genreAverages[0]?.average.toFixed(1) ?? "—";

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Star className="size-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Average Rating</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{stats.averageRating?.toFixed(1) ?? "—"}</p>
        <p className="text-xs text-muted-foreground mt-1">Across your library</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Total Ratings</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{stats.totalRatings}</p>
        <p className="text-xs text-muted-foreground mt-1">Titles rated</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-green-500" />
          <h3 className="text-sm font-semibold">Top Genre</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{topGenre}</p>
        <p className="text-xs text-muted-foreground mt-1">{topGenreAvg} avg rating</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Star className="size-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Recent Activity</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{stats.monthlyActivity[stats.monthlyActivity.length - 1]?.count ?? 0}</p>
        <p className="text-xs text-muted-foreground mt-1">Ratings this month</p>
      </div>
    </div>
  );
}
