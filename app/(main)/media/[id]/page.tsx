import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock3, Users } from "lucide-react";
import { Suspense } from "react";
import { MediaActions } from "@/components/library/media-actions";
import { GenreBadge } from "@/components/media/genre-badge";
import { RatingBadge } from "@/components/media/rating-badge";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import { findMediaById } from "@/lib/media/queries";
import { getUserMediaState } from "@/lib/library/queries";
import { createClient } from "@/lib/supabase/server";

import { SuspendedCastAndPlatforms } from "@/components/media/suspended-cast-and-platforms";
import { SuspendedRatingSection } from "@/components/ratings/suspended-rating-section";
import { SuspendedReviewsSection } from "@/components/reviews/suspended-reviews-section";
import { SuspendedSimilarMedia } from "@/components/media/suspended-similar-media";

export default async function MediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reviewsPage?: string }>;
}) {
  const { id } = await params;
  
  // Critical Path Only
  const media = await findMediaById(id);
  if (!media) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userState = user ? await getUserMediaState(user.id, media.id) : null;
  const reviewsPage = Math.max(1, Number((await searchParams).reviewsPage) || 1);

  const facts = [
    ["Release Date", media.year?.toString() ?? "TBA"],
    ["Runtime", media.runtime ? `${media.runtime} min` : "Not available"],
    ["Language", media.language ?? "Not available"],
    ["Country", media.country ?? "Not available"],
    ["Status", MEDIA_STATUS_LABELS[media.status]],
    ["Episodes", media.episodeCount?.toString() ?? "Not available"],
  ];
  
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 md:-mx-8 md:-mt-8">
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        {media.backdropUrl && (
          <Image
            src={media.backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover opacity-30 mix-blend-multiply dark:opacity-40 dark:mix-blend-screen"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/60 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 md:px-8 md:pb-16 md:pt-12">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Explore
          </Link>
          <div className="mt-8 grid gap-8 sm:grid-cols-[16rem_1fr] lg:grid-cols-[20rem_1fr] items-end">
            {media.posterUrl ? (
              <div className="relative mx-auto aspect-[2/3] w-56 overflow-hidden rounded-xl border border-border/20 shadow-2xl shadow-black/20 dark:shadow-[0_0_60px_rgba(0,0,0,0.8)] sm:mx-0 sm:w-full">
                <Image
                  src={media.posterUrl}
                  alt={`${media.title} poster`}
                  fill
                  priority
                  sizes="(max-width: 640px) 14rem, 20rem"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[2/3] w-56 rounded-xl bg-muted border border-border shadow-2xl shadow-black/20 dark:shadow-[0_0_60px_rgba(0,0,0,0.8)] sm:w-full" />
            )}
            <div className="pb-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary border border-primary/30">
                  {MEDIA_TYPE_LABELS[media.mediaType]}
                </span>
                <span className="rounded-full bg-muted/50 px-3 py-1 text-xs font-semibold border border-border/50">
                  {MEDIA_STATUS_LABELS[media.status]}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl text-foreground">
                {media.title}
              </h1>
              {media.originalTitle && media.originalTitle !== media.title && (
                <p className="mt-2 text-lg text-muted-foreground">
                  {media.originalTitle}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <RatingBadge rating={media.averageRating} />
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {media.voteCount.toLocaleString()} votes
                </span>
                {media.runtime && (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock3 className="size-4" />
                    {media.runtime} min
                  </span>
                )}
              </div>
              <div className="mt-8">
                <MediaActions
                  mediaId={media.id}
                  initialStatus={userState?.library?.status ?? null}
                  inWishlist={Boolean(userState?.wishlist)}
                  initialRating={userState?.rating?.rating ? Number(userState.rating.rating) : null}
                  initialProgress={userState?.library?.progress ?? 0}
                  episodeCount={media.episodeCount}
                  libraryEntryId={userState?.library?.id ?? null}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
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
          <h2 className="text-xl font-bold mb-6">Rating and Reviews</h2>
          <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted mb-8" />}>
            <SuspendedRatingSection
              media={media}
              userId={user?.id ?? null}
              userRating={userState?.rating ? { id: userState.rating.id, rating: Number(userState.rating.rating) } : null}
            />
          </Suspense>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted mt-8" />}>
            <SuspendedReviewsSection mediaId={media.id} userId={user?.id ?? null} page={reviewsPage} />
          </Suspense>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-bold">Similar titles</h2>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
            <SuspendedSimilarMedia media={media} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
