"use client";

import { useState } from "react";
import { AverageRatingCard } from "@/components/ratings/average-rating-card";
import { RatingDialog } from "@/components/ratings/rating-dialog";
import type { MediaRatingSummary } from "@/types/rating";

export function MediaRatingSection({ mediaId, initialSummary }: { mediaId: string; initialSummary: MediaRatingSummary }) {
  const [summary, setSummary] = useState(initialSummary);
  
  // Calculate histogram max for scaling bars
  const maxCount = Math.max(...summary.ratingDistribution.map(d => d.count), 1);

  return (
    <section className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/* Left Column: Analytics */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6">
          {/* Taste Match Box */}
          {summary.tasteMatch !== null && summary.tasteMatch !== undefined && (
            <div className="rounded-xl bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Taste Match</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white">{summary.tasteMatch}%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Community member scores fit your profile.</p>
            </div>
          )}
          
          {/* Histogram */}
          <div>
            <p className="text-sm font-semibold mb-3">Rating Distribution</p>
            {summary.ratingCount === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20 text-center text-sm text-muted-foreground">
                No ratings yet. Be the first to rate!
              </div>
            ) : (
              <div className="flex items-end gap-1 h-24">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => {
                  const data = summary.ratingDistribution.find((d) => d.rating === rating);
                  const count = data?.count ?? 0;
                  const heightPercent = Math.max((count / maxCount) * 100, 2); // Minimum 2% height for visibility
                  return (
                    <div key={rating} className="group flex flex-1 flex-col items-center gap-2">
                      <div className="relative flex h-full w-full items-end">
                        <div
                          className="relative w-full rounded-t-sm bg-primary/20 transition-colors group-hover:bg-primary"
                          style={{ height: `${heightPercent}%` }}
                        >
                          {count > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                              {count}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">{rating}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <AverageRatingCard summary={summary} />
      </div>

      {/* Right Column: Interaction */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Rate and remember</p>
        <h2 className="mt-2 text-2xl font-bold">Your score shapes your taste profile.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Use half-star precision to teach MovieMinds what you love. Your rating updates this title’s member score instantly.
        </p>
        <div className="mt-8">
          <RatingDialog mediaId={mediaId} summary={summary} onSaved={setSummary} />
        </div>
      </div>
    </section>
  );
}
