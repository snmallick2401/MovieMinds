import { calculateTasteMatch } from "@/lib/ratings/similarity";
import { prisma } from "@/lib/prisma";
import type { MediaDetail } from "@/types/media";
import { MediaRatingSection } from "@/components/ratings/media-rating-section";
import type { MediaRatingSummary, RatingDistributionItem } from "@/types/rating";

export async function SuspendedRatingSection({
  media,
  userId,
  userRating,
}: {
  media: MediaDetail;
  userId: string | null;
  userRating: { id: string; rating: number } | null;
}) {
  const [ratingDistributionQuery, tasteMatch] = await Promise.all([
    prisma.media.findUnique({ where: { id: media.id }, select: { ratingDistribution: true } }),
    userId ? calculateTasteMatch(userId, media.id) : Promise.resolve(null),
  ]);

  const ratingSummary: MediaRatingSummary = {
    communityAverageRating: media.communityAverageRating,
    weightedRating: media.weightedRating,
    ratingCount: media.ratingCount,
    popularityScore: media.popularityScore,
    ratingDistribution: (ratingDistributionQuery?.ratingDistribution as RatingDistributionItem[]) ?? [],
    currentUserRating: userRating,
    tasteMatch,
  };

  return <MediaRatingSection mediaId={media.id} initialSummary={ratingSummary} />;
}
