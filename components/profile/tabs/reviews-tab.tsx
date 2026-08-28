import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";

export async function ReviewsTab({ userId, username }: { userId: string, username: string }) {
  const reviews = await prisma.review.findMany({
    where: { userId, visibility: "PUBLIC" },
    include: {
      media: {
        select: { id: true, slug: true, title: true, posterUrl: true, year: true, mediaType: true }
      },
      user: {
        select: { id: true, displayName: true, username: true, avatarUrl: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  if (reviews.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-12 rounded-xl border border-dashed border-border bg-card">
        No reviews yet.
      </div>
    );
  }

  // Fetch ratings for these media items by this user to display alongside reviews
  const mediaIds = reviews.map(r => r.mediaId);
  const ratings = await prisma.userRating.findMany({
    where: { userId, mediaId: { in: mediaIds } }
  });
  const ratingMap = new Map(ratings.map(r => [r.mediaId, Number(r.rating)]));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Reviews ({reviews.length})</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-4 p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <Link href={`/media/${review.media.slug || review.media.id}`} className="shrink-0">
              <div className="relative h-32 w-24 overflow-hidden rounded-md border border-border">
                {review.media.posterUrl ? (
                  <Image src={review.media.posterUrl} alt={review.media.title} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center p-1 text-center text-xs">
                    {review.media.title}
                  </div>
                )}
              </div>
            </Link>
            
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <Link href={`/media/${review.media.slug || review.media.id}`} className="font-bold text-lg leading-tight hover:underline line-clamp-1">
                    {review.media.title} <span className="font-normal text-muted-foreground text-sm">({review.media.year})</span>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reviewed {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {ratingMap.has(review.mediaId) && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md shrink-0">
                    <Star className="size-3.5 fill-primary" />
                    <span className="font-semibold text-sm">{ratingMap.get(review.mediaId)?.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-sm text-foreground/90 line-clamp-4 whitespace-pre-wrap">
                {review.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
