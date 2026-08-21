import { notFound } from "next/navigation";
import { Suspense } from "react";
import { findMediaBySlugOrId } from "@/lib/media/queries";
import { getUserMediaState } from "@/lib/library/queries";
import { createClient } from "@/lib/supabase/server";
import { SuspendedRatingSection } from "@/components/ratings/suspended-rating-section";
import { SuspendedReviewsSection } from "@/components/reviews/suspended-reviews-section";

export default async function MediaReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reviewsPage?: string }>;
}) {
  const { slug } = await params;
  const media = await findMediaBySlugOrId(slug);
  if (!media) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userState = user ? await getUserMediaState(user.id, media.id) : null;
  const reviewsPage = Math.max(1, Number((await searchParams).reviewsPage) || 1);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 md:px-8">
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
    </div>
  );
}
