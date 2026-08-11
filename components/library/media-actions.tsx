"use client";

import { Bookmark, Check, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LibraryStatus } from "@/types/library";

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
  const [status, setStatus] = useState(initialStatus);
  const [wishlist, setWishlist] = useState(inWishlist);
  const [rating, setRating] = useState(initialRating?.toString() ?? "");
  const [progress, setProgress] = useState(initialProgress);
  const [message, setMessage] = useState<string | null>(null);
  async function addToLibrary(nextStatus: LibraryStatus, nextProgress = progress) {
    const response = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, status: nextStatus, progress: nextProgress }),
    });
    if (response.ok) {
      setStatus(nextStatus);
      setMessage("Saved to your library.");
    } else setMessage("Could not update your library.");
  }
  async function addWishlist() {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    if (response.ok) {
      setWishlist(true);
      setMessage("Added to wishlist.");
    } else setMessage("Could not update wishlist.");
  }
  async function saveRating(value: string) {
    setRating(value);
    if (!value) return;
    const response = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, rating: Number(value) }),
    });
    setMessage(response.ok ? "Rating saved." : "Could not save rating.");
  }
  async function saveProgress(value: number) {
    setProgress(value);
    if (!status || !libraryEntryId) return addToLibrary("WATCHING", value);
    const response = await fetch(`/api/library/${libraryEntryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: value }),
    });
    setMessage(response.ok ? "Progress saved." : "Could not save progress.");
  }
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => addToLibrary(status === "WATCHING" ? "COMPLETED" : "WATCHING")}
        >
          <Check className="size-4" />
          {status === "WATCHING"
            ? "Mark completed"
            : status
              ? "Update library"
              : "Add to library"}
        </Button>
        <Button variant="outline" onClick={addWishlist} disabled={wishlist}>
          <Bookmark className="size-4" />
          {wishlist ? "On wishlist" : "Add to wishlist"}
        </Button>
        <select
          aria-label="Library state"
          value={status ?? ""}
          onChange={(event) =>
            event.target.value && addToLibrary(event.target.value as LibraryStatus)
          }
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">Choose status</option>
          <option value="WATCHING">Watching</option>
          <option value="COMPLETED">Completed</option>
          <option value="PLAN_TO_WATCH">Plan to watch</option>
          <option value="ON_HOLD">On hold</option>
          <option value="DROPPED">Dropped</option>
        </select>
      </div>
      {episodeCount && (
        <div className="max-w-sm">
          <label className="flex justify-between text-sm font-medium">
            <span>Episode progress</span>
            <span>
              {progress} / {episodeCount}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max={episodeCount}
            value={Math.min(progress, episodeCount)}
            onChange={(event) => saveProgress(Number(event.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Star className="size-4 text-amber-500" />
        <label htmlFor="personal-rating" className="text-sm font-medium">
          Your rating
        </label>
        <select
          id="personal-rating"
          value={rating}
          onChange={(event) => saveRating(event.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
        >
          <option value="">Not rated</option>
          {Array.from({ length: 20 }, (_, index) => (index + 1) / 2).map((value) => (
            <option key={value} value={value}>
              {value.toFixed(1)} / 10
            </option>
          ))}
        </select>
      </div>
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
    </div>
  );
}
