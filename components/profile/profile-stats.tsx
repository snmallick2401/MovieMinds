import { Clapperboard, Clock, Flame, Star, Trophy } from "lucide-react";

export function ProfileStats({
  totalWatched,
  hoursWatched,
  averageRating,
  topGenre,
  streakDays = 1,
}: {
  totalWatched: number;
  hoursWatched: number;
  averageRating: number | null;
  topGenre: string;
  streakDays?: number;
}) {
  const stats = [
    {
      label: "Completed",
      subtext: "Titles",
      value: totalWatched,
      icon: Clapperboard,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Hours",
      subtext: "Watch time",
      value: hoursWatched,
      icon: Clock,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Average rating",
      subtext: "Your ratings",
      value: averageRating ? averageRating.toFixed(1) : "—",
      icon: Star,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Day streak",
      subtext: "Keep it up!",
      value: streakDays,
      icon: Flame,
      color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    },
    {
      label: "Top genre",
      subtext: "Most watched",
      value: topGenre || "—",
      icon: Trophy,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(({ label, subtext, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div className={`flex size-10 items-center justify-center rounded-xl border ${color}`}>
            <Icon className="size-5" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
