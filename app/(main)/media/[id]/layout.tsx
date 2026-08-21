import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock3, Users } from "lucide-react";
import { Suspense } from "react";
import { MediaActions } from "@/components/library/media-actions";
import { RatingBadge } from "@/components/media/rating-badge";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/media/constants";
import { findMediaById } from "@/lib/media/queries";
import { getUserMediaState } from "@/lib/library/queries";
import { createClient } from "@/lib/supabase/server";
import { MediaTabs } from "@/components/media/media-tabs";

export default async function MediaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const t0 = performance.now();
  const { id } = await params;
  
  const tMediaStart = performance.now();
  const mediaPromise = findMediaById(id);
  const supabasePromise = createClient().then((client) => client.auth.getUser());

  const [media, { data: authData }] = await Promise.all([mediaPromise, supabasePromise]);
  const tMediaLoaded = performance.now();
  if (!media) notFound();

  const user = authData.user;
  const tUserStart = performance.now();
  const userState = user ? await getUserMediaState(user.id, media.id) : null;
  const tUserLoaded = performance.now();

  console.log(JSON.stringify({
    level: "info",
    tag: "TIMING_MEDIA_LAYOUT",
    mediaId: id,
    mediaFindMs: Math.round(tMediaLoaded - tMediaStart),
    userStateMs: Math.round(tUserLoaded - tUserStart),
    totalLayoutMs: Math.round(tUserLoaded - t0),
  }));


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

        <div className="mx-auto max-w-7xl px-4 pb-0 pt-8 sm:px-6 md:px-8 md:pt-12">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Explore
          </Link>
          <div className="mt-8 grid gap-8 sm:grid-cols-[16rem_1fr] lg:grid-cols-[20rem_1fr] items-end pb-8 md:pb-12">
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
          
          <MediaTabs mediaId={media.id} />
        </div>
      </section>
      
      {children}
    </div>
  );
}
