import { BarChart3, Clock3, Star, Trophy } from "lucide-react";
import { StatsCharts } from "@/components/stats/stats-charts";
import { requireUser } from "@/lib/auth/server";
import { getUserStats } from "@/lib/library/queries";
import { recalculateUserStats } from "@/lib/media/aggregates";

export default async function StatsPage() {
  const user = await requireUser();
  const [stats, ratingStats] = await Promise.all([
    getUserStats(user.id),
    recalculateUserStats(user.id)
  ]);
  const cards = [
    { label: "Completed", value: stats.totalWatched, icon: Trophy },
    { label: "Hours watched", value: stats.hoursWatched, icon: Clock3 },
    {
      label: "Average rating",
      value: ratingStats.averageRating?.toFixed(1) ?? "—",
      icon: Star,
    },
    { label: "Ratings given", value: ratingStats.totalRatings, icon: BarChart3 },
  ];
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Your viewing habits
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Statistics</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <Icon className="size-5 text-amber-400" />
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <StatsCharts stats={stats} ratingStats={ratingStats} />
    </div>
  );
}
