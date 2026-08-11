"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const labels: Record<string, string> = {
  q: "Search",
  genre: "Genre",
  type: "Type",
  language: "Language",
  country: "Country",
  platform: "Platform",
  rating: "Rating",
  status: "Status",
  yearFrom: "From",
  yearTo: "To",
  runtime: "Runtime",
  minRating: "Rating",
};

export function ActiveFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = Array.from(searchParams.entries()).filter(
    ([key]) => key !== "page" && key !== "sort" && key !== "pageSize",
  );
  if (!active.length) return null;
  function clear(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }
  return (
    <div className="flex flex-wrap gap-2" aria-label="Active filters">
      {active.map(([key, value]) => (
        <button
          key={key}
          type="button"
          onClick={() => clear(key)}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
        >
          {labels[key] ?? key}: {value.replaceAll(",", ", ")}
          <X className="size-3" aria-hidden="true" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
        Clear all
      </Button>
    </div>
  );
}
