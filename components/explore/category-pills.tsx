"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Flame, Sword, Compass, Drama, Film, Sparkles, Laugh, Skull, Heart, Ghost, Eye } from "lucide-react";

const popularCategories = [
  { label: "All", value: "", icon: Flame },
  { label: "Action", value: "Action", icon: Sword },
  { label: "Adventure", value: "Adventure", icon: Compass },
  { label: "Drama", value: "Drama", icon: Drama },
  { label: "Sci-Fi", value: "Sci-Fi", icon: Film },
  { label: "Animation", value: "Animation", icon: Sparkles },
  { label: "Comedy", value: "Comedy", icon: Laugh },
  { label: "Thriller", value: "Thriller", icon: Skull },
  { label: "Fantasy", value: "Fantasy", icon: Ghost },
  { label: "Romance", value: "Romance", icon: Heart },
  { label: "Mystery", value: "Mystery", icon: Eye },
];

export function CategoryPills() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get("genre") ?? "";

  function selectGenre(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("genre", val);
    } else {
      params.delete("genre");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          Popular right now
        </h2>
        <Link
          href="/explore?sort=popular"
          className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 transition-colors hover:underline"
        >
          View trending
          <TrendingUp className="size-3.5" />
        </Link>
      </div>

      {/* Horizontal Scroll Pill Bar */}
      <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
        {popularCategories.map(({ label, value, icon: Icon }) => {
          const isActive = currentGenre === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => selectGenre(value)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "border-border/80 bg-card text-muted-foreground hover:border-purple-500/40 hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Icon className={`size-3.5 ${isActive ? "text-white" : "text-purple-400"}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
