import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Star, UserPlus, CheckCircle2, Bookmark, Heart } from "lucide-react";

type ActivityCardProps = {
  activity: any; // Ideally typed with Prisma includes
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const { user, type, media, review, rating, targetUser, createdAt } = activity;

  let icon = <CheckCircle2 className="size-4 text-primary" />;
  let actionText = "interacted with";
  
  if (type === "REVIEWED") {
    icon = <MessageSquareIcon className="size-4 text-blue-400" />;
    actionText = "reviewed";
  } else if (type === "RATED") {
    icon = <Star className="size-4 text-amber-400 fill-amber-400" />;
    actionText = "rated";
  } else if (type === "COMPLETED") {
    icon = <CheckCircle2 className="size-4 text-emerald-400" />;
    actionText = "completed";
  } else if (type === "WISHLISTED") {
    icon = <Bookmark className="size-4 text-purple-400" />;
    actionText = "added to watchlist";
  } else if (type === "FOLLOWED") {
    icon = <UserPlus className="size-4 text-pink-400" />;
    actionText = "followed";
  } else if (type === "REVIEW_LIKED") {
    icon = <Heart className="size-4 text-red-400 fill-red-400" />;
    actionText = "liked a review of";
  }

  return (
    <div className="flex gap-4 p-4 transition-colors hover:bg-muted/30 rounded-xl border border-border/50 bg-card/50">
      {/* Avatar */}
      <Link href={`/user/${user.username}`} className="shrink-0">
        <Avatar src={user.avatarUrl} name={user.displayName} className="size-10 border border-border/50" />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1 flex-wrap">
          <Link href={`/user/${user.username}`} className="font-bold text-foreground hover:underline">
            {user.displayName}
          </Link>
          <span className="flex items-center gap-1">
            {icon}
            {actionText}
          </span>
          {targetUser && (
            <Link href={`/user/${targetUser.username}`} className="font-bold text-foreground hover:underline">
              {targetUser.displayName}
            </Link>
          )}
          {media && !targetUser && (
            <Link href={`/media/${media.slug || media.id}`} className="font-bold text-foreground hover:underline truncate max-w-[200px]">
              {media.title}
            </Link>
          )}
          <span className="text-xs ml-auto">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Media / Review Context */}
        {media && (type === "REVIEWED" || type === "RATED" || type === "COMPLETED") && (
          <div className="mt-3 flex gap-4 rounded-xl border border-border/50 bg-background/50 p-3">
            <Link href={`/media/${media.slug || media.id}`} className="shrink-0 relative h-24 w-16 overflow-hidden rounded-md shadow-sm transition-transform hover:scale-105">
              {media.posterUrl ? (
                <Image src={media.posterUrl} alt={media.title} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="size-full bg-muted" />
              )}
            </Link>
            
            <div className="flex flex-col flex-1 py-1">
              <Link href={`/media/${media.slug || media.id}`} className="font-bold hover:underline line-clamp-1">
                {media.title}
              </Link>
              
              {rating && (
                <div className="mt-1 flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold">{Number(rating.rating).toFixed(1)}</span>
                </div>
              )}
              
              {review && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic border-l-2 border-primary/30 pl-3">
                  "{review.body}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
