"use client";

import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { MobileFilters } from "@/components/filters/filter-sidebar";
import { SortSelect } from "@/components/filters/sort-select";

type Genre = { id: string; name: string };

export function ExploreHeader({
  total,
  sortValue,
  genres,
  onViewChange,
}: {
  total: number;
  sortValue: string;
  genres: Genre[];
  onViewChange?: (view: "grid" | "list") => void;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  function handleViewChange(mode: "grid" | "list") {
    setViewMode(mode);
    if (onViewChange) onViewChange(mode);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm font-medium text-muted-foreground">
        <span className="font-bold text-foreground">{total.toLocaleString()}</span> titles found
      </p>

      <div className="flex items-center gap-3">
        <MobileFilters genres={genres} />
        <SortSelect value={sortValue} />

        {/* Grid vs List View Toggle */}
        <div className="hidden sm:flex items-center rounded-xl border border-border/80 bg-card p-1">
          <button
            type="button"
            onClick={() => handleViewChange("grid")}
            aria-label="Grid view"
            className={`rounded-lg p-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("list")}
            aria-label="List view"
            className={`rounded-lg p-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
