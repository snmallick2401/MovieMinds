"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RatingBadge } from "@/components/media/rating-badge";
import { Input } from "@/components/ui/input";
import { MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import type { MediaSummary } from "@/types/media";

const RECENT_KEY = "movieminds-recent-searches";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MediaSummary[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    setRecent(JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[]);
  }, []);
  useEffect(() => {
    const value = query.trim();
    if (!value) return void setItems([]);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (response.ok) setItems((await response.json()).items as MediaSummary[]);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Search fetch error:", error);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function submit(value = query) {
    const search = value.trim();
    if (!search) return;
    const next = [
      search,
      ...recent.filter((item) => item.toLowerCase() !== search.toLowerCase()),
    ].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecent(next);
    setOpen(false);
    router.push(`/explore?q=${encodeURIComponent(search)}`);
  }

  return (
    <div ref={containerRef} className={`relative ${compact ? "w-full" : "max-w-md flex-1"}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") setOpen(false);
        }}
        aria-label="Search movies, anime, and series"
        aria-expanded={open}
        aria-controls="search-suggestions"
        placeholder="Search movies, anime, shows…"
        className="pl-9 pr-9"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
      {open && (query.trim() || recent.length > 0) && (
        <div
          id="search-suggestions"
          className="absolute z-30 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-border bg-card p-2 shadow-xl"
        >
          {query.trim() ? (
            <>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                onClick={() => submit()}
              >
                Search for <span className="text-primary">“{query.trim()}”</span>
              </button>
              {items.map((media) => (
                <Link
                  key={media.id}
                  href={`/media/${media.slug ?? media.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {media.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {MEDIA_TYPE_LABELS[media.mediaType]} · {media.year ?? "TBA"}
                    </span>
                  </span>
                  <RatingBadge rating={media.averageRating} />
                </Link>
              ))}
            </>
          ) : (
            <div className="p-1">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent searches
              </p>
              {recent.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setQuery(item);
                    submit(item);
                  }}
                  className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
