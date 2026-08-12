import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GenreBadge } from "@/components/media/genre-badge";
import { MEDIA_STATUS_LABELS } from "@/lib/media/constants";
import { findMediaById } from "@/lib/media/queries";
import { SuspendedCastAndPlatforms } from "@/components/media/suspended-cast-and-platforms";
import { SuspendedSimilarMedia } from "@/components/media/suspended-similar-media";

export default async function MediaOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const media = await findMediaById(id);
  if (!media) notFound();

  const facts = [
    ["Release Date", media.year?.toString() ?? "TBA"],
    ["Runtime", media.runtime ? `${media.runtime} min` : "Not available"],
    ["Language", media.language ?? "Not available"],
    ["Country", media.country ?? "Not available"],
    ["Status", MEDIA_STATUS_LABELS[media.status]],
    ["Episodes", media.episodeCount?.toString() ?? "Not available"],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 md:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <h2 className="text-xl font-bold">Overview</h2>
          <p className="mt-4 max-w-3xl whitespace-pre-line leading-relaxed text-muted-foreground">
            {media.description ?? "A synopsis has not been added to this title yet."}
          </p>
          {media.genres.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {media.genres.map((genre) => (
                <GenreBadge key={genre.id} name={genre.name} />
              ))}
            </div>
          )}
        </div>
        <aside className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-bold mb-5">Details</h2>
          <dl className="space-y-4">
            {facts.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground font-medium">{label}</dt>
                <dd className="text-right font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
        <SuspendedCastAndPlatforms media={media} />
      </Suspense>

      <section>
        <h2 className="mb-6 text-xl font-bold">Similar titles</h2>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
          <SuspendedSimilarMedia media={media} />
        </Suspense>
      </section>
    </div>
  );
}
