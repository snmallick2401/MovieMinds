"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <select
      aria-label="Sort results"
      value={value}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams.toString());
        if (event.target.value === "popular") params.delete("sort");
        else params.set("sort", event.target.value);
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
    >
      <option value="popular">Most popular</option>
      <option value="rating">Top rated</option>
      <option value="newest">Newest</option>
      <option value="recent">Recently added</option>
    </select>
  );
}
