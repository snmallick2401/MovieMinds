import { hydrateMediaDetails } from "@/lib/media/queries";
import type { MediaDetail } from "@/types/media";
import { CastCarousel } from "./cast-carousel";
import Image from "next/image";
import { Tv, ExternalLink } from "lucide-react";

const FALLBACK_PLATFORMS = [
  { id: "fallback-netflix", name: "Netflix", logoUrl: null, region: "Global", watchUrl: null },
  { id: "fallback-prime", name: "Prime Video", logoUrl: null, region: "Global", watchUrl: null },
  { id: "fallback-disney", name: "Disney+", logoUrl: null, region: "Global", watchUrl: null },
  { id: "fallback-apple", name: "Apple TV+", logoUrl: null, region: "Global", watchUrl: null },
];

export async function SuspendedCastAndPlatforms({ media }: { media: MediaDetail }) {
  try {
    const hydrated = await hydrateMediaDetails(media);
    const platformsToDisplay = hydrated.platforms.length > 0 ? hydrated.platforms : FALLBACK_PLATFORMS;

    return (
      <div className="space-y-10">
        {/* Cast & Crew Section */}
        {hydrated.credits && hydrated.credits.length > 0 ? (
          <CastCarousel credits={hydrated.credits} />
        ) : (
          <section>
            <h2 className="text-xl font-bold mb-4">Featured Cast &amp; Crew</h2>
            <div className="flex h-32 items-center justify-center rounded-2xl border border-border/80 bg-card/60 text-center text-muted-foreground shadow-sm">
              <p className="text-sm">Cast information is currently unavailable.</p>
            </div>
          </section>
        )}

        {/* Where to Watch / Streaming Providers Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">Where to Watch</h2>
            <span className="text-xs font-semibold text-muted-foreground">Streaming Providers</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {platformsToDisplay.slice(0, 12).map((platform) => {
              const content = (
                <>
                  {/* High-Contrast Light Container for Dark & Transparent Brand Logos */}
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center">
                    {platform.logoUrl ? (
                      <Image
                        src={platform.logoUrl}
                        alt={`${platform.name} logo`}
                        width={36}
                        height={36}
                        className="size-full object-contain"
                      />
                    ) : (
                      <Tv className="size-5 text-zinc-800" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {platform.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {platform.region ?? "Stream"}
                    </p>
                  </div>

                  {"watchUrl" in platform && platform.watchUrl && (
                    <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </>
              );

              if ("watchUrl" in platform && platform.watchUrl) {
                return (
                  <a
                    key={platform.id}
                    href={platform.watchUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-md group"
                    title={`Watch on ${platform.name}`}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={platform.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-md group"
                  title={platform.name}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  } catch {
    return (
      <section>
        <h2 className="text-xl font-bold mb-4">Where to Watch</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {FALLBACK_PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 p-2.5 shadow-sm"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center">
                <Tv className="size-5 text-zinc-800" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{platform.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{platform.region}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
}
