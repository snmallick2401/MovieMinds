"use client";

import { Bookmark, Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DragonBall } from "@/components/icons/dragon-ball";
import { DragonBallRating } from "@/components/ratings/dragon-ball-rating";
import { MEDIA_STATUS_LABELS } from "@/lib/media/constants";
import type { LibraryStatus } from "@/types/library";

const STATUS_CONFIG: Record<LibraryStatus, { label: string; iconColor: string }> = {
  WATCHING: { label: "Watching", iconColor: "text-blue-400" },
  COMPLETED: { label: "Completed", iconColor: "text-emerald-400" },
  PLAN_TO_WATCH: { label: "Plan to watch", iconColor: "text-amber-400" },
  ON_HOLD: { label: "On hold", iconColor: "text-purple-400" },
  DROPPED: { label: "Dropped", iconColor: "text-rose-400" },
};

export function MediaActions({
  mediaId,
  initialStatus,
  inWishlist,
  initialRating,
  initialProgress,
  episodeCount,
  libraryEntryId,
}: {
  mediaId: string;
  initialStatus: LibraryStatus | null;
  inWishlist: boolean;
  initialRating: number | null;
  initialProgress: number;
  episodeCount: number | null;
  libraryEntryId: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LibraryStatus | null>(initialStatus);
  const [entryId, setEntryId] = useState<string | null>(libraryEntryId);
  const [wishlist, setWishlist] = useState(inWishlist);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [progress, setProgress] = useState(initialProgress);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Status Dropdown state
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [tempRating, setTempRating] = useState<number | null>(initialRating);

  // Close status dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    if (statusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [statusMenuOpen]);

  async function updateStatus(nextStatus: LibraryStatus) {
    if (busy) return;
    setBusy(true);
    setStatusMenuOpen(false);
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, status: nextStatus, progress }),
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const data = await response.json();
      if (response.ok) {
        setStatus(nextStatus);
        if (data.item?.id) setEntryId(data.item.id);
        setMessage(`Moved to ${STATUS_CONFIG[nextStatus].label}.`);
      } else {
        setMessage("Could not update library.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeFromLibrary() {
    if (busy || !entryId) return;
    setBusy(true);
    setStatusMenuOpen(false);
    try {
      const response = await fetch(`/api/library/${entryId}`, {
        method: "DELETE",
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (response.ok) {
        setStatus(null);
        setEntryId(null);
        setMessage("Removed from your library.");
      } else {
        setMessage("Could not remove from library.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleWishlist() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (response.ok) {
        setWishlist(!wishlist);
        setMessage(wishlist ? "Removed from wishlist." : "Added to wishlist.");
      } else {
        setMessage("Could not update wishlist.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRating() {
    if (tempRating === null) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, rating: tempRating }),
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (response.ok) {
        setRating(tempRating);
        setRatingModalOpen(false);
        setMessage("Rating saved.");
      } else {
        setMessage("Could not save rating.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveRating() {
    setBusy(true);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, rating: 0 }),
      });
      setRating(null);
      setTempRating(null);
      setRatingModalOpen(false);
      setMessage("Rating removed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProgress(value: number) {
    setProgress(value);
    if (!status || !entryId) return updateStatus("WATCHING");
    const response = await fetch(`/api/library/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: value }),
    });
    setMessage(response.ok ? "Progress saved." : "Could not save progress.");
  }

  const currentRatingNumber = rating ? Number(rating) : null;
  const ratingBalls = currentRatingNumber ? Math.max(1, Math.min(7, Math.round(currentRatingNumber))) : 4;

  return (
    <div className="space-y-4">
      {/* Unified Action Toolbar: Consistent h-10, rounded-xl, px-4 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Consolidated Library Status Dropdown / Split Action */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatusMenuOpen((prev) => !prev)}
            aria-expanded={statusMenuOpen}
            className={`inline-flex h-10 items-center justify-between gap-2.5 rounded-xl px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
              status
                ? "border border-primary/40 bg-primary/10 text-primary shadow-sm hover:bg-primary/20 hover:border-primary/60"
                : "bg-primary text-primary-foreground shadow hover:bg-primary/90"
            }`}
          >
            <div className="flex items-center gap-2">
              {status ? (
                <Check className="size-4 shrink-0 text-primary" />
              ) : (
                <Plus className="size-4 shrink-0" />
              )}
              <span>{status ? `In Library: ${STATUS_CONFIG[status].label}` : "Add to Library"}</span>
            </div>
            <ChevronDown
              className={`size-3.5 opacity-70 transition-transform duration-200 ${
                statusMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Frosted Glass Dropdown Menu */}
          {statusMenuOpen && (
            <div className="absolute left-0 top-full z-40 mt-2 w-52 rounded-2xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Set Library Status
              </div>
              <div className="space-y-0.5">
                {(Object.keys(STATUS_CONFIG) as LibraryStatus[]).map((key) => {
                  const item = STATUS_CONFIG[key];
                  const isSelected = status === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateStatus(key)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-primary/20 text-primary"
                          : "text-foreground/80 hover:bg-white/10 hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground"}`} />
                        {item.label}
                      </span>
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>

              {status && (
                <>
                  <div className="my-1 border-t border-border/50" />
                  <button
                    type="button"
                    onClick={removeFromLibrary}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="size-3.5" />
                    Remove from library
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 2. Wishlist Uniform Button */}
        <button
          type="button"
          onClick={toggleWishlist}
          disabled={busy}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
            wishlist
              ? "border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-sm hover:bg-purple-500/20 hover:border-purple-500/60"
              : "border-border/80 bg-card/60 text-foreground/80 hover:border-border hover:bg-card hover:text-foreground"
          }`}
        >
          <Bookmark className={`size-4 ${wishlist ? "fill-purple-400 text-purple-400" : "text-muted-foreground"}`} />
          <span>{wishlist ? "On wishlist" : "Wishlist"}</span>
        </button>

        {/* 3. Rating Uniform Button */}
        <button
          type="button"
          onClick={() => {
            setTempRating(rating);
            setRatingModalOpen(true);
          }}
          disabled={busy}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
            currentRatingNumber
              ? "border-orange-500/40 bg-orange-500/10 text-orange-400 font-bold hover:bg-orange-500/20 hover:border-orange-500/60 shadow-sm"
              : "border-border/80 bg-card/60 text-foreground/80 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-orange-400"
          }`}
        >
          <DragonBall stars={ratingBalls} size={18} active={Boolean(currentRatingNumber)} />
          <span>{currentRatingNumber ? `${currentRatingNumber.toFixed(1)} / 7` : "Rate"}</span>
        </button>
      </div>

      {/* Episode Progress Slider for TV / Anime series */}
      {episodeCount && status === "WATCHING" && (
        <div className="max-w-xs pt-1">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
            <span>Episode progress</span>
            <span className="font-semibold text-foreground">
              {progress} / {episodeCount}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={episodeCount}
            value={Math.min(progress, episodeCount)}
            onChange={(event) => saveProgress(Number(event.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>
      )}

      {message && (
        <p role="status" className="text-xs font-medium text-muted-foreground animate-in fade-in">
          {message}
        </p>
      )}

      {/* Interactive Rating & Review Modal */}
      {ratingModalOpen && (
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
                onClick={() => setRatingModalOpen(false)}
                className="rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="my-8 flex flex-col items-center">
              <DragonBallRating
                value={tempRating}
                onChange={setTempRating}
                size="lg"
                showLabel={true}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="flex-1 h-11 font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:from-orange-400 hover:to-amber-400 transition-all rounded-xl"
                disabled={busy || tempRating === null}
                onClick={handleSaveRating}
              >
                {busy ? "Saving..." : "Save Rating"}
              </Button>

              {currentRatingNumber && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={handleRemoveRating}
                  className="h-11 px-4 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
