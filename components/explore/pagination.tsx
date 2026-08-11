"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function getPageUrl(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    return `${pathname}?${params.toString()}`;
  }

  // Calculate visible page numbers
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Catalog pagination">
      {/* Previous Button */}
      {page > 1 ? (
        <Link
          href={getPageUrl(page - 1)}
          className="flex h-9 items-center gap-1 rounded-xl border border-border/80 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Link>
      ) : (
        <span className="flex h-9 items-center gap-1 rounded-xl border border-border/40 bg-card/40 px-3 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed">
          <ChevronLeft className="size-4" />
          Previous
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5 px-2">
        {pages.map((p, idx) => {
          if (typeof p === "string") {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                ...
              </span>
            );
          }
          const isCurrent = p === page;
          return (
            <Link
              key={p}
              href={getPageUrl(p)}
              className={`flex size-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                isCurrent
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "border border-border/60 bg-card text-foreground hover:bg-muted"
              }`}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      {page < totalPages ? (
        <Link
          href={getPageUrl(page + 1)}
          className="flex h-9 items-center gap-1 rounded-xl border border-border/80 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Next
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className="flex h-9 items-center gap-1 rounded-xl border border-border/40 bg-card/40 px-3 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed">
          Next
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
