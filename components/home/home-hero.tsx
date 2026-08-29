"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckSquare, Clock, Film, Flame, MessageSquare, Shield, Sparkles, Star, Trophy, Zap } from "lucide-react";
import type { MediaSummary } from "@/types/media";

export function HomeHero({
  userName,
  isLoggedIn = false,
  stats,
  featuredPosters,
}: {
  userName?: string | null;
  isLoggedIn?: boolean;
  stats?: {
    totalWatched: number;
    hoursWatched: number;
    averageRating: number | null;
    favoriteGenres: Array<{ name: string; count: number }>;
  };
  featuredPosters: MediaSummary[];
}) {
  const topGenre = stats?.favoriteGenres[0]?.name || "Drama";
  const posters = featuredPosters.slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-purple-950/80 to-slate-950 p-6 shadow-2xl sm:p-9">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-600/25 via-indigo-600/10 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Side Content */}
        <div className="space-y-6">
          {isLoggedIn ? (
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-400">
                <Sparkles className="size-3.5" />
                Welcome back
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
                Welcome back, <span className="text-purple-400 whitespace-nowrap">{userName || "Cinephile"}</span>.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Build your watchlist, keep track of every story, and find your next obsession.
              </p>
            </div>
          ) : (
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-400">
                <Sparkles className="size-3.5" />
                Next-Gen Cinephile Universe
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white leading-tight">
                Discover, Track &amp; Rate <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  Movies, Anime &amp; Series
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                The modern home for entertainment lovers. Browse thousands of titles, get AI-powered recommendations, rate with Dragon Balls, and connect with fellow fans.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/explore"
                className="inline-flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-purple-600 px-6 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:shadow-purple-500/40"
              >
                <Zap className="size-4 fill-white" />
                Start exploring
                <span className="text-purple-200">→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/40"
                >
                  <Sparkles className="size-4 fill-white" />
                  Get Started Free
                  <span className="text-purple-200">→</span>
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  <Zap className="size-4" />
                  Explore Catalog
                </Link>
              </>
            )}
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

      {/* Bottom Feature & Metrics Bar */}
      {isLoggedIn && stats ? (
        <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-purple-500/20 pt-6 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
              <CheckSquare className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">
                {stats.totalWatched}
              </p>
              <p className="text-[11px] font-medium text-white/70">Completed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">
                {stats.hoursWatched}
              </p>
              <p className="text-[11px] font-medium text-white/70">Hours watched</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Star className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">
                {stats.averageRating ? stats.averageRating.toFixed(1) : "—"}
              </p>
              <p className="text-[11px] font-medium text-white/70">Average rating</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <Flame className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">1</p>
              <p className="text-[11px] font-medium text-white/70">Day streak</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Shield className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">{topGenre}</p>
              <p className="text-[11px] font-medium text-white/70">Top genre</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-purple-500/20 pt-6 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
              <Film className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">10,000+</p>
              <p className="text-[11px] font-medium text-white/70">Movies &amp; Anime</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <Star className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">Dragon Ball</p>
              <p className="text-[11px] font-medium text-white/70">7-Star Ratings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">AI Powered</p>
              <p className="text-[11px] font-medium text-white/70">Taste Match</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">Community</p>
              <p className="text-[11px] font-medium text-white/70">Discussions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Trophy className="size-4" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">Tracker</p>
              <p className="text-[11px] font-medium text-white/70">Custom Watchlists</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
