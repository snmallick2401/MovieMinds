"use client";

import { useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  Clock3,
  Heart,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { MediaGrid } from "@/components/media/media-grid";
import { Button } from "@/components/ui/button";
import {
  LIBRARY_STATUS_LABELS,
  type LibraryEntry,
  type LibraryStatus,
  type WishlistEntry,
} from "@/types/library";

const tabs: Array<{ status: LibraryStatus; icon: typeof Clock3 }> = [
  { status: "WATCHING", icon: Clock3 },
  { status: "COMPLETED", icon: CheckCircle2 },
  { status: "PLAN_TO_WATCH", icon: Bookmark },
  { status: "ON_HOLD", icon: PauseCircle },
  { status: "DROPPED", icon: XCircle },
];

export function LibraryDashboard({
  initialItems,
  wishlist,
}: {
  initialItems: LibraryEntry[];
  wishlist: WishlistEntry[];
}) {
  const [items, setItems] = useState(initialItems);
  const [active, setActive] = useState<LibraryStatus | "WISHLIST">("WATCHING");
  const visible =
    active === "WISHLIST"
      ? wishlist.map((item) => item.media)
      : items.filter((item) => item.status === active).map((item) => item.media);
  async function markCompleted(entry: LibraryEntry) {
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === entry.id
          ? {
              ...item,
              status: "COMPLETED",
              completed: true,
              watchCount: item.watchCount + (item.completed ? 0 : 1),
            }
          : item,
      ),
    );
    const response = await fetch(`/api/library/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        progress: entry.media.episodeCount ?? entry.progress,
      }),
    });
    if (!response.ok) setItems(previous);
  }
  const activeEntries =
    active === "WISHLIST" ? [] : items.filter((item) => item.status === active);
  return (
    <div className="space-y-7">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ status, icon: Icon }) => (
          <Button
            key={status}
            variant={active === status ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(status)}
          >
            <Icon className="size-4" />
            {LIBRARY_STATUS_LABELS[status]}{" "}
            <span className="text-xs opacity-70">
              {items.filter((item) => item.status === status).length}
            </span>
          </Button>
        ))}
        <Button
          variant={active === "WISHLIST" ? "default" : "outline"}
          size="sm"
          onClick={() => setActive("WISHLIST")}
        >
          <Heart className="size-4" />
          Wishlist {wishlist.length}
        </Button>
      </div>
      {active === "WATCHING" && activeEntries.length > 0 && (
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="font-semibold">Continue watching</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {activeEntries.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-card p-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{entry.media.title}</span>
                  <span className="text-sm text-muted-foreground">
                    Episode {entry.progress}
                    {entry.media.episodeCount ? ` / ${entry.media.episodeCount}` : ""}
                  </span>
                </span>
                <Button size="sm" onClick={() => markCompleted(entry)}>
                  Complete
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
      <MediaGrid
        items={visible}
        emptyMessage={
          active === "WISHLIST"
            ? "Save titles to your wishlist from their media pages."
            : `No titles are ${LIBRARY_STATUS_LABELS[active].toLowerCase()} yet.`
        }
      />
    </div>
  );
}
