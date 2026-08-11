import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export async function RatingsTab({ userId, username }: { userId: string, username: string }) {
  const ratings = await prisma.userRating.findMany({
    where: { userId },
    include: {
      media: {
        select: { id: true, title: true, posterUrl: true, year: true, mediaType: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  if (ratings.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-12 rounded-xl border border-dashed border-border bg-card">
        No ratings yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Ratings ({ratings.length})</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {ratings.map((rating) => (
          <div key={rating.id} className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-2 shadow-sm transition-transform hover:scale-105">
            <Link href={`/media/${rating.media.id}`} className="block">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-border">
                {rating.media.posterUrl ? (
                  <Image 
                    src={rating.media.posterUrl} 
                    alt={rating.media.title} 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw" 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted p-2 text-center text-xs">
                    {rating.media.title}
                  </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-yellow-500 backdrop-blur-sm">
                    <Star className="size-3 fill-current" />
                    <span className="text-xs font-bold text-white">{Number(rating.rating).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Link>
            
            <div className="px-1 text-center">
              <Link href={`/media/${rating.media.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                {rating.media.title}
              </Link>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(rating.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
