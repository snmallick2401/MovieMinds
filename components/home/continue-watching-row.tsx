"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import type { LibraryEntry } from "@/types/library";
import type { MediaSummary } from "@/types/media";

export function ContinueWatchingRow({
  userEntries,
  fallbackItems,
}: {
  userEntries: LibraryEntry[];
  fallbackItems: MediaSummary[];
}) {
  // Use real user in-progress entries or format fallback titles
  const displayItems = userEntries.length
    ? userEntries.map((entry) => ({
        id: entry.media.id,
        slug: entry.media.slug ?? null,
        title: entry.media.title,
        posterUrl: entry.media.posterUrl,
        mediaType: entry.media.mediaType,
        subtitle:
          entry.media.mediaType === "TV" || entry.media.mediaType === "ANIME"
            ? `S1 E${Math.max(1, entry.progress)} · 45m left`
            : `${entry.media.runtime ?? 120}m left`,
        progressPct:
          entry.media.episodeCount && entry.media.episodeCount > 0
            ? Math.min(100, Math.round((entry.progress / entry.media.episodeCount) * 100))
            : 65,
      }))
    : fallbackItems.slice(0, 4).map((item, idx) => {
        const defaultPcts = [65, 40, 72, 28];
        const defaultSubtitles = [
          "S1 E12 · 45m left",
          "S2 E8 · 10m left",
          "2h 49m left",
          "S3 E4 · 22m left",
        ];
        return {
          id: item.id,
          slug: item.slug ?? null,
          title: item.title,
          posterUrl: item.posterUrl,
          mediaType: item.mediaType,
          subtitle: defaultSubtitles[idx % defaultSubtitles.length],
          progressPct: defaultPcts[idx % defaultPcts.length],
        };
      });

  if (displayItems.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Continue watching
          </h2>
          <p className="text-xs text-muted-foreground">Pick up where you left off.</p>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-1 text-xs font-semibold text-purple-400 transition-colors hover:underline"
        >
          View library
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayItems.map((item) => (
          <Link
            key={item.id}
            href={`/media/${item.slug ?? item.id}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl"
          >
            {/* Poster Image Container */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              {item.posterUrl ? (
                <Image
                  src={item.posterUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 300px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="size-full bg-purple-950/40" />
              )}

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Media Type Badge */}
              <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                {MEDIA_TYPE_LABELS[item.mediaType]}
              </span>

              {/* Play Icon Hover Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-purple-600/90 text-white shadow-xl backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:bg-purple-600">
                  <Play className="size-5 fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Card Content & Progress Bar */}
            <div className="p-4">
              <h3 className="line-clamp-1 font-bold text-sm text-foreground transition-colors group-hover:text-purple-400">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>

              {/* Progress Bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${item.progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {item.progressPct}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
