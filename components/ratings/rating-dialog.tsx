"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { DragonBallRating } from "@/components/ratings/dragon-ball-rating";
import { DragonBall } from "@/components/icons/dragon-ball";
import { Button } from "@/components/ui/button";
import type { MediaRatingSummary } from "@/types/rating";

export function RatingDialog({ mediaId, summary, onSaved }: { mediaId: string; summary: MediaRatingSummary; onSaved: (summary: MediaRatingSummary) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | null>(summary.currentUserRating?.rating ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (value === null) return;
    setBusy(true);
    setError(null);
    const endpoint = summary.currentUserRating ? `/api/ratings/${summary.currentUserRating.id}` : "/api/ratings";
    const response = await fetch(endpoint, {
      method: summary.currentUserRating ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(summary.currentUserRating ? { rating: value } : { mediaId, rating: value }),
    });
    const payload = await response.json() as { rating?: { id: string; rating: number }; summary?: Omit<MediaRatingSummary, "distribution" | "currentUserRating">; error?: string };
    setBusy(false);
    if (!response.ok || !payload.rating || !payload.summary) {
      setError(payload.error ?? "Could not save rating.");
      return;
    }
    onSaved({ ...summary, ...payload.summary, currentUserRating: payload.rating });
    setOpen(false);
  }

  async function remove() {
    if (!summary.currentUserRating) return;
    setBusy(true);
    const response = await fetch(`/api/ratings/${summary.currentUserRating.id}`, { method: "DELETE" });
    const payload = await response.json() as { summary?: Omit<MediaRatingSummary, "distribution" | "currentUserRating">; error?: string };
    setBusy(false);
    if (!response.ok || !payload.summary) { setError(payload.error ?? "Could not remove rating."); return; }
    onSaved({ ...summary, ...payload.summary, currentUserRating: null });
    setValue(null);
    setOpen(false);
  }

  const currentRating = summary.currentUserRating?.rating;
  const ballsForButton = currentRating ? Math.max(1, Math.min(7, Math.round(currentRating))) : 4;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 h-10 px-5 font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition-all"
      >
        <DragonBall stars={ballsForButton} size={18} active />
        {currentRating ? `${currentRating.toFixed(1)} / 7` : "Rate this title"}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Rate this title"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Rate with Dragon Balls
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                  How would you rate this?
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close rating dialog"
                onClick={() => setOpen(false)}
                className="rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="my-8 flex flex-col items-center gap-2">
              <DragonBallRating value={value} onChange={setValue} size="lg" />
              <p className="mt-1 text-xs text-muted-foreground">
                Community average: {summary.communityAverageRating?.toFixed(1) ?? "—"} / 7
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="flex-1 h-11 font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:from-orange-400 hover:to-amber-400 transition-all"
                disabled={busy || value === null}
                onClick={save}
              >
                {busy ? "Saving..." : "Save Rating"}
              </Button>
              {summary.currentUserRating && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={remove}
                  className="h-11 px-4 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  Remove
                </Button>
              )}
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
