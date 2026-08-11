"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckSquare, Clock, Flame, Shield, Sparkles, Star, Zap } from "lucide-react";
import type { MediaSummary } from "@/types/media";

export function HomeHero({
  userName,
  stats,
  featuredPosters,
}: {
  userName: string;
  stats: {
    totalWatched: number;
    hoursWatched: number;
    averageRating: number | null;
    favoriteGenres: Array<{ name: string; count: number }>;
  };
  featuredPosters: MediaSummary[];
}) {
  const topGenre = stats.favoriteGenres[0]?.name || "Drama";
  const posters = featuredPosters.slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-purple-950/80 to-slate-950 p-6 shadow-2xl sm:p-9">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-600/25 via-indigo-600/10 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Side Content */}
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-400">
              <Sparkles className="size-3.5" />
              Welcome back
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
              Welcome back, <span className="text-purple-400">{userName}</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Build your watchlist, keep track of every story, and find your next obsession.
            </p>
          </div>

          <div>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-purple-600 px-6 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40"
            >
              <Zap className="size-4 fill-white" />
              Start exploring
              <span className="text-purple-200">→</span>
            </Link>
          </div>
        </div>

        {/* Right Side Poster Collage */}
        <div className="hidden relative h-64 w-full lg:block">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-950/40 to-slate-950 z-10" />
          <div className="grid h-full grid-cols-4 gap-3 overflow-hidden rounded-2xl opacity-85 transition-opacity hover:opacity-100">
            {posters.map((item, index) => (
              <div
                key={item.id}
                className={`relative h-full overflow-hidden rounded-xl border border-white/10 shadow-2xl transition-transform duration-500 hover:scale-105 ${
                  index % 2 === 1 ? "translate-y-4" : "-translate-y-2"
                }`}
              >
                {item.posterUrl ? (
                  <Image
                    src={item.posterUrl}
                    alt={item.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="size-full bg-purple-900/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Quick Metrics Bar */}
      <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-purple-500/20 pt-6 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <CheckSquare className="size-4" />
          </div>
          <div>
            <p className="text-base font-extrabold leading-tight text-foreground">
              {stats.totalWatched}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">Completed</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Clock className="size-4" />
          </div>
          <div>
            <p className="text-base font-extrabold leading-tight text-foreground">
              {stats.hoursWatched}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">Hours watched</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Star className="size-4" />
          </div>
          <div>
            <p className="text-base font-extrabold leading-tight text-foreground">
              {stats.averageRating ? stats.averageRating.toFixed(1) : "—"}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">Average rating</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <Flame className="size-4" />
          </div>
          <div>
            <p className="text-base font-extrabold leading-tight text-foreground">1</p>
            <p className="text-[11px] font-medium text-muted-foreground">Day streak</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Shield className="size-4" />
          </div>
          <div>
            <p className="text-base font-extrabold leading-tight text-foreground">{topGenre}</p>
            <p className="text-[11px] font-medium text-muted-foreground">Top genre</p>
          </div>
        </div>
      </div>
    </div>
  );
}
