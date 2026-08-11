import { ReviewSkeleton } from "@/components/reviews/review-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MediaLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-96 rounded-none" />
      <div className="mx-auto max-w-7xl space-y-5 px-4">
        <Skeleton className="h-32" />
        <ReviewSkeleton />
      </div>
    </div>
  );
}
