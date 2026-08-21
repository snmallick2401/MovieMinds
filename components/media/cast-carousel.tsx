"use client";

import Image from "next/image";
import { UserCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import type { MediaCredit } from "@/types/media";

export function CastCarousel({ credits }: { credits: MediaCredit[] }) {
  const cast = credits.filter((c) => c.role === "CAST");
  const crew = credits.filter((c) => c.role === "CREW");
  const displayCredits = [...cast, ...crew];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [checkScrollability, displayCredits.length]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -400 : 400;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }

  if (displayCredits.length === 0) return null;

  return (
    <section className="relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight">Featured Cast &amp; Crew</h2>
        <button
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
          }}
          className="text-xs font-semibold text-primary transition-colors hover:underline"
        >
          View all ({displayCredits.length})
        </button>
      </div>

      {/* Carousel Viewport Container */}
      <div className="relative">
        {/* Soft Gradient Left Edge Mask */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background via-background/80 to-transparent transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Soft Gradient Right Edge Mask */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Floating Navigation Button: Left */}
        <button
          type="button"
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll cast left"
          className={`absolute left-2 top-12 z-20 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-white/15 bg-background/80 text-foreground shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-background hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-0 ${
            canScrollLeft ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Floating Navigation Button: Right */}
        <button
          type="button"
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Scroll cast right"
          className={`absolute right-2 top-12 z-20 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-white/15 bg-background/80 text-foreground shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-background hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-0 ${
            canScrollRight ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Horizontal Scroll Track without raw OS scrollbars */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {displayCredits.map((credit, idx) => (
            <div
              key={`${credit.id}-${idx}`}
              className="flex flex-col items-center min-w-[100px] max-w-[120px] snap-start group/card"
            >
              <div className="relative size-24 overflow-hidden rounded-full border-2 border-border/60 bg-muted shadow-md transition-transform duration-300 group-hover/card:scale-105 group-hover/card:border-primary/50">
                {credit.profileUrl ? (
                  <Image
                    src={credit.profileUrl}
                    alt={credit.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10">
                    <UserCircle2 className="size-10 text-primary/50 stroke-[1.5]" />
                  </div>
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm font-bold leading-tight line-clamp-2 transition-colors group-hover/card:text-primary">
                  {credit.name}
                </p>
                {credit.job === "Voice Actor" ? (
                  <span className="mt-1.5 inline-block rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                    Voice Actor
                  </span>
                ) : null}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {credit.role === "CAST" ? credit.character : credit.job}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
