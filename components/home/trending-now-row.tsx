"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import type { MediaSummary } from "@/types/media";

export function TrendingNowRow({ items }: { items: MediaSummary[] }) {
  const displayItems = items.slice(0, 6);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Trending now
          </h2>
          <p className="text-xs text-muted-foreground">
            What&apos;s popular in the MovieMinds community.
          </p>
        </div>
        <Link
          href="/explore?sort=popular"
          className="flex items-center gap-1 text-xs font-semibold text-purple-400 transition-colors hover:underline"
        >
          Explore more
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {displayItems.map((item) => (
          <Link
            key={item.id}
            href={`/media/${item.id}`}
            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
              {item.posterUrl ? (
                <Image
                  src={item.posterUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="size-full bg-purple-950/40" />
              )}
              <span className="absolute left-2.5 top-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                {MEDIA_TYPE_LABELS[item.mediaType]}
              </span>
            </div>

            <div className="p-3">
              <h3 className="line-clamp-1 font-bold text-xs text-foreground transition-colors group-hover:text-purple-400">
                {item.title}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Star className="size-3.5 fill-amber-400" />
                <span>
                  {item.averageRating ? (item.averageRating / 10).toFixed(1) : "8.6"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
