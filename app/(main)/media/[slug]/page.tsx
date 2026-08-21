import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GenreBadge } from "@/components/media/genre-badge";
import { MEDIA_STATUS_LABELS } from "@/lib/media/constants";
import { findMediaBySlugOrId } from "@/lib/media/queries";
import { formatCountryName, formatLanguageName } from "@/lib/utils";
import { SuspendedCastAndPlatforms } from "@/components/media/suspended-cast-and-platforms";
import { SuspendedSimilarMedia } from "@/components/media/suspended-similar-media";

export default async function MediaOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const media = await findMediaBySlugOrId(slug);
  if (!media) notFound();

  const isTv = ["TV", "ANIME", "OVA", "SPECIAL"].includes(media.mediaType);
  const formattedLanguage = formatLanguageName(media.language);
  const formattedCountry = formatCountryName(media.country);

  const facts: Array<[string, string]> = [
    ["Release Year", media.year?.toString() ?? "TBA"],
    ...(formattedLanguage ? [["Language", formattedLanguage]] as [string, string][] : []),
    ...(formattedCountry ? [["Country", formattedCountry]] as [string, string][] : []),
    ...(media.contentRating ? [["Age Rating", media.contentRating]] as [string, string][] : []),
    ...(isTv && media.seasonCount ? [["Seasons", media.seasonCount.toString()]] as [string, string][] : []),
    ...(isTv && media.episodeCount ? [["Episodes", media.episodeCount.toString()]] as [string, string][] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 md:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <p className="max-w-3xl whitespace-pre-line leading-relaxed text-muted-foreground sm:text-base">
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
          <h2 className="font-bold mb-5 text-sm uppercase tracking-wider text-muted-foreground">Information</h2>
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

      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
        <SuspendedContextualNews mediaTitle={media.title} />
      </Suspense>
    </div>
  );
}

import { getNewsForMedia } from "@/lib/news/queries";
import { NewsCarousel } from "@/components/news/news-carousel";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

async function SuspendedContextualNews({ mediaTitle }: { mediaTitle: string }) {
  const articles = await getNewsForMedia(mediaTitle, 8);
  
  if (!articles || articles.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Related News</h2>
        <Link href="/news" className="flex items-center text-sm font-semibold text-primary hover:underline">
          More News <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <NewsCarousel articles={articles} />
    </section>
  );
}
