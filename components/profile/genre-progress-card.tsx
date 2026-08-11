import Link from "next/link";
import { Compass, Drama, Film, Flame, Sword } from "lucide-react";

const genreIcons: Record<string, typeof Drama> = {
  Drama: Drama,
  Action: Sword,
  Adventure: Compass,
  "Sci-Fi": Film,
  Mystery: Flame,
};

export function GenreProgressCard({
  favoriteGenres,
}: {
  favoriteGenres: Array<{ name: string; count: number }>;
}) {
  const maxCount = Math.max(1, ...favoriteGenres.map((g) => g.count));

  // Fallback defaults if user hasn't watched titles yet
  const displayGenres = favoriteGenres.length
    ? favoriteGenres
    : [
        { name: "Drama", count: 0 },
        { name: "Action", count: 0 },
        { name: "Adventure", count: 0 },
        { name: "Sci-Fi", count: 0 },
        { name: "Mystery", count: 0 },
      ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Favorite Genres</h2>
          <Link href="/stats" className="text-xs font-semibold text-purple-400 hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-5 space-y-3.5">
          {displayGenres.slice(0, 5).map((genre) => {
            const Icon = genreIcons[genre.name] || Film;
            const pct = maxCount > 0 ? Math.round((genre.count / maxCount) * 100) : 0;
            return (
              <div key={genre.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span>{genre.name}</span>
                  </div>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
