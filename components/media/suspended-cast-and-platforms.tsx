import { hydrateMediaDetails } from "@/lib/media/queries";
import type { MediaDetail } from "@/types/media";
import { CastCarousel } from "./cast-carousel";
import Image from "next/image";

const FALLBACK_PLATFORMS = [
  { id: "fallback-netflix", name: "Netflix", logoUrl: null, region: "Global" },
  { id: "fallback-prime", name: "Prime Video", logoUrl: null, region: "Global" },
  { id: "fallback-disney", name: "Disney+", logoUrl: null, region: "Global" },
  { id: "fallback-apple", name: "Apple TV+", logoUrl: null, region: "Global" },
];

export async function SuspendedCastAndPlatforms({ media }: { media: MediaDetail }) {
  try {
    const hydrated = await hydrateMediaDetails(media);
    const platformsToDisplay = hydrated.platforms.length > 0 ? hydrated.platforms : FALLBACK_PLATFORMS;
    
    return (
      <>
        {hydrated.credits && hydrated.credits.length > 0 ? (
          <CastCarousel credits={hydrated.credits} />
        ) : (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Cast & Crew</h2>
            <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card text-center text-muted-foreground shadow-sm">
              <p>Cast information is currently unavailable.</p>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">Where to Watch</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {platformsToDisplay.slice(0, 12).map((platform) => (
              <div
                key={platform.id}
                className="flex h-16 items-center justify-center rounded-2xl border border-border/50 bg-card/30 p-2 shadow-sm hover:bg-card hover:border-primary/50 transition-all"
                title={platform.name}
              >
                {platform.logoUrl ? (
                  <Image src={platform.logoUrl} alt={platform.name} width={40} height={40} className="rounded-lg object-contain" />
                ) : (
                  <span className="text-sm font-medium text-foreground px-2 text-center line-clamp-2">
                    {platform.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </>
    );
  } catch {
    return (
      <section>
        <h2 className="text-xl font-bold mb-4">Where to Watch</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {FALLBACK_PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="flex h-16 items-center justify-center rounded-2xl border border-border/50 bg-card/30 p-2 shadow-sm"
            >
              <span className="text-sm font-medium text-foreground px-2 text-center line-clamp-2">
                {platform.name}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }
}
