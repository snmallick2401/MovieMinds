import { getMediaReviews } from "@/lib/reviews/queries";
import { ReviewList } from "@/components/reviews/review-list";

export async function SuspendedReviewsSection({
  mediaId,
  userId,
  page,
}: {
  mediaId: string;
  userId: string | null;
  page: number;
}) {
  const reviewData = await getMediaReviews(mediaId, userId, page);
  return (
    <div className="mt-8">
      <ReviewList data={reviewData} mediaId={mediaId} currentUserId={userId} />
    </div>
  );
}
