"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import type { MediaSummary } from "@/types/media";

export function RecommendedRow({ items }: { items: MediaSummary[] }) {
  const matchPcts = [92, 89, 87, 87, 84, 82];
  const displayItems = items.slice(0, 6);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Recommended for you
          </h2>
          <p className="text-xs text-muted-foreground">Personalized picks based on your taste.</p>
        </div>
        <Link
          href="/explore"
          className="flex items-center gap-1 text-xs font-semibold text-purple-400 transition-colors hover:underline"
        >
          See all
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {displayItems.map((item, idx) => {
          const matchPct = matchPcts[idx % matchPcts.length];
          return (
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

                {/* Match Percentage Pill Badge */}
                <span className="absolute left-2.5 top-2.5 rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                  {matchPct}% Match
                </span>
              </div>

              <div className="p-3">
                <h3 className="line-clamp-1 font-bold text-xs text-foreground transition-colors group-hover:text-purple-400">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {item.year ?? "2024"} · {MEDIA_TYPE_LABELS[item.mediaType]}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-400 font-semibold">
                  <Star className="size-3.5 fill-amber-400" />
                  <span>
                    {item.averageRating ? (item.averageRating / 10).toFixed(1) : "8.8"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
