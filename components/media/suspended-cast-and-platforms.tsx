import { hydrateMediaDetails } from "@/lib/media/queries";
import type { MediaDetail } from "@/types/media";
import { CastCarousel } from "./cast-carousel";
import Image from "next/image";

export async function SuspendedCastAndPlatforms({ media }: { media: MediaDetail }) {
  const hydrated = await hydrateMediaDetails(media);
  
  return (
    <>
      {hydrated.credits?.length > 0 && (
        <CastCarousel credits={hydrated.credits} />
      )}

      <section>
        <h2 className="text-xl font-bold">Where to Watch</h2>
        {hydrated.platforms.length ? (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {hydrated.platforms.slice(0, 12).map((platform) => (
              <div
                key={platform.id}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/50 transition-colors"
              >
                {platform.logoUrl ? (
                  <Image src={platform.logoUrl} alt={platform.name} width={48} height={48} className="rounded-lg shadow-sm" />
                ) : (
                  <span className="text-sm font-medium text-center">{platform.name}</span>
                )}
                {platform.region && (
                  <span className="mt-2 text-xs text-muted-foreground text-center">
                    ({platform.region})
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
            <p>Streaming availability will be added as providers are synchronized.</p>
          </div>
        )}
      </section>
    </>
  );
}
