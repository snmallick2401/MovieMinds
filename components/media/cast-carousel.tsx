import Image from "next/image";
import { UserCircle2 } from "lucide-react";
import type { MediaCredit } from "@/types/media";

export function CastCarousel({ credits }: { credits: MediaCredit[] }) {
  const cast = credits.filter((c) => c.role === "CAST");
  const crew = credits.filter((c) => c.role === "CREW");
  const displayCredits = [...cast, ...crew];

  if (displayCredits.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Featured Cast & Crew</h2>
        <button className="text-sm font-semibold text-primary hover:underline">
          View Full Cast
        </button>
      </div>
      <div className="mt-4 flex gap-6 overflow-x-auto pb-4 snap-x">
        {displayCredits.map((credit, idx) => (
          <div key={`${credit.id}-${idx}`} className="flex flex-col items-center min-w-[100px] max-w-[120px] snap-start">
            <div className="relative size-24 overflow-hidden rounded-full border-2 border-border/50 shadow-md">
              {credit.profileUrl ? (
                <Image
                  src={credit.profileUrl}
                  alt={credit.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/10">
                  <UserCircle2 className="size-10 text-accent/50 stroke-[1.5]" />
                </div>
              )}
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-bold leading-tight line-clamp-2">{credit.name}</p>
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
    </section>
  );
}
