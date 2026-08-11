"use client";

import Image from "next/image";
import Link from "next/link";
import { Film, Clapperboard, Tv, Video, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import type { MediaSummary } from "@/types/media";

const mediaTypeQuickLinks = [
  { label: "Movies", type: "MOVIE", icon: Film },
  { label: "TV Series", type: "TV", icon: Tv },
  { label: "Anime Series", type: "ANIME", icon: Sparkles },
  { label: "Anime Movies", type: "ANIME_MOVIE", icon: Clapperboard },
  { label: "Documentaries", type: "DOCUMENTARY", icon: Video },
];

export function ExploreHero({ featuredPosters }: { featuredPosters: MediaSummary[] }) {
  // Use up to 4 featured posters for collage background
  const posters = featuredPosters.slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-purple-950/90 to-slate-950 p-6 shadow-2xl sm:p-10 lg:p-12">
      {/* Background Ambient Glow & Grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_var(--tw-gradient-stops))] from-purple-600/20 via-indigo-600/10 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Side Info & Hero Search */}
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-400">
              <Sparkles className="size-3.5" />
              Discover your next story
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
              Explore every kind of screen story.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Movies, series, anime, documentaries, and more, all in one thoughtful catalog.
            </p>
          </div>

          {/* Hero Search Box */}
          <div className="max-w-xl">
            <SearchBar compact />
          </div>

          {/* Quick Media Type Pill Links */}
          <div className="flex flex-wrap gap-2 pt-2">
            {mediaTypeQuickLinks.map(({ label, type, icon: Icon }) => (
              <Link
                key={label}
                href={`/explore?type=${type}`}
                className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/60 px-3.5 py-2 text-xs font-semibold text-foreground backdrop-blur transition-all hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300"
              >
                <Icon className="size-3.5 text-purple-400" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side Featured Poster Collage Artwork */}
        <div className="hidden relative h-72 w-full lg:block">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-950/40 to-slate-950 z-10" />
          <div className="grid h-full grid-cols-4 gap-3 overflow-hidden rounded-2xl opacity-80 transition-opacity hover:opacity-100">
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
    </div>
  );
}
