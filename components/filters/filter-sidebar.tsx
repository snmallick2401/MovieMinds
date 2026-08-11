"use client";

import { SlidersHorizontal, X, Search, ChevronDown, ChevronUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CONTENT_RATINGS,
  FEATURED_PLATFORMS,
  MEDIA_STATUS_LABELS,
  MEDIA_TYPE_LABELS,
} from "@/lib/media/constants";
import { mediaStatuses, mediaTypes, type MediaFilters } from "@/types/media";

type Genre = { id: string; name: string };

function ToggleGroup({
  title,
  param,
  options,
  searchable = false,
  collapsible = false,
  initialVisible = 6,
}: {
  title: string;
  param: string;
  options: Array<{ value: string; label: string; count?: number }>;
  searchable?: boolean;
  collapsible?: boolean;
  initialVisible?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const active = searchParams.get(param)?.split(",").filter(Boolean) ?? [];

  function toggle(value: string) {
    const next = active.includes(value)
      ? active.filter((item) => item !== value)
      : [...active, value];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set(param, next.join(","));
    else params.delete(param);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const visibleOptions =
    collapsible && !expanded ? filteredOptions.slice(0, initialVisible) : filteredOptions;

  return (
    <fieldset className="border-t border-border/60 pt-4">
      <legend className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>

      {/* Optional Search Filter inside section */}
      {searchable && (
        <div className="relative mb-2.5">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8.5 w-full rounded-lg border border-border/80 bg-background/50 pl-8 pr-3 text-xs focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      {/* Checkbox List */}
      <div className="space-y-1.5">
        {visibleOptions.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={active.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="size-3.5 rounded border-border/80 accent-purple-600"
              />
              <span>{option.label}</span>
            </div>
            {option.count !== undefined && (
              <span className="text-[10px] text-muted-foreground/70">{option.count}</span>
            )}
          </label>
        ))}
      </div>

      {/* Show More / Show Less Toggle */}
      {collapsible && filteredOptions.length > initialVisible && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:underline"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Show more <ChevronDown className="size-3" />
            </>
          )}
        </button>
      )}
    </fieldset>
  );
}

function RangeFields() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(param, value);
    else params.delete(param);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const yearFrom = searchParams.get("yearFrom") ?? "1900";
  const yearTo = searchParams.get("yearTo") ?? "2026";

  return (
    <fieldset className="border-t border-border/60 pt-4">
      <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Year
      </legend>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>{yearFrom}</span>
        <span>to</span>
        <span>{yearTo}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="1888"
          max="2100"
          aria-label="From year"
          placeholder="1900"
          defaultValue={searchParams.get("yearFrom") ?? ""}
          onBlur={(event) => change("yearFrom", event.target.value)}
          className="h-8.5 w-full rounded-lg border border-border/80 bg-background/50 px-2.5 text-xs focus:border-purple-500 focus:outline-none"
        />
        <input
          type="number"
          min="1888"
          max="2100"
          aria-label="To year"
          placeholder="2026"
          defaultValue={searchParams.get("yearTo") ?? ""}
          onBlur={(event) => change("yearTo", event.target.value)}
          className="h-8.5 w-full rounded-lg border border-border/80 bg-background/50 px-2.5 text-xs focus:border-purple-500 focus:outline-none"
        />
      </div>
    </fieldset>
  );
}

function SelectField({
  title,
  param,
  options,
}: {
  title: string;
  param: string;
  options: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(param, val);
    else params.delete(param);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <fieldset className="border-t border-border/60 pt-4">
      <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      <select
        aria-label={title}
        value={searchParams.get(param) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8.5 w-full rounded-lg border border-border/80 bg-background/50 px-2.5 text-xs text-foreground focus:border-purple-500 focus:outline-none"
      >
        <option value="">Any {title.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

export function FilterControls({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setValue(param: keyof MediaFilters, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(param, value);
    else params.delete(param);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const minRating = searchParams.get("minRating") ?? "0";

  return (
    <div className="space-y-4">
      {/* Media Type */}
      <ToggleGroup
        title="Media type"
        param="type"
        options={mediaTypes.map((value) => ({ value, label: MEDIA_TYPE_LABELS[value] }))}
      />

      {/* Genre */}
      <ToggleGroup
        title="Genre"
        param="genre"
        searchable
        collapsible
        initialVisible={7}
        options={genres.map(({ name }) => ({ value: name, label: name }))}
      />

      {/* Year */}
      <RangeFields />

      {/* Language */}
      <SelectField
        title="Language"
        param="language"
        options={[
          { value: "EN", label: "English" },
          { value: "JA", label: "Japanese" },
          { value: "KO", label: "Korean" },
          { value: "ES", label: "Spanish" },
          { value: "FR", label: "French" },
        ]}
      />

      {/* Country */}
      <SelectField
        title="Country"
        param="country"
        options={[
          { value: "US", label: "United States" },
          { value: "JP", label: "Japan" },
          { value: "KR", label: "South Korea" },
          { value: "GB", label: "United Kingdom" },
          { value: "IN", label: "India" },
        ]}
      />

      {/* Content Rating */}
      <ToggleGroup
        title="Content rating"
        param="rating"
        options={CONTENT_RATINGS.map((value) => ({ value, label: value }))}
      />

      {/* Status */}
      <ToggleGroup
        title="Status"
        param="status"
        options={mediaStatuses.map((value) => ({
          value,
          label: MEDIA_STATUS_LABELS[value],
        }))}
      />

      {/* Streaming on */}
      <ToggleGroup
        title="Streaming on"
        param="platform"
        searchable
        collapsible
        initialVisible={5}
        options={FEATURED_PLATFORMS.map((value) => ({ value, label: value }))}
      />

      {/* Minimum Rating */}
      <fieldset className="border-t border-border/60 pt-4">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Minimum rating
        </legend>
        <input
          aria-label="Minimum rating"
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={Number(minRating) > 10 ? Number(minRating) / 10 : minRating}
          onChange={(event) =>
            setValue("minRating", event.target.value === "0" ? "" : (Number(event.target.value) * 10).toString())
          }
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-medium">
          <span>0</span>
          <span>{Number(minRating) > 10 ? (Number(minRating) / 10).toFixed(1) : Number(minRating).toFixed(1)} and up</span>
          <span>10</span>
        </div>
      </fieldset>
    </div>
  );
}

export function FilterSidebar({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className="hidden w-64 shrink-0 rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:block">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
          <SlidersHorizontal className="size-4 text-purple-400" />
          Filters
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          disabled={!searchParams.size}
          className="h-7 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
        >
          Clear all
        </Button>
      </div>
      <FilterControls genres={genres} />
    </aside>
  );
}

export function MobileFilters({ genres }: { genres: Genre[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="lg:hidden h-9 text-xs font-semibold gap-2 rounded-xl" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-3.5 text-purple-400" />
        Filters
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <FilterControls genres={genres} />
            <Button className="mt-6 w-full rounded-xl bg-purple-600 text-white font-bold" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
