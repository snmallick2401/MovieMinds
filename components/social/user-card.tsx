import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import { prisma } from "@/lib/prisma";
import type { TasteMatchResult } from "@/lib/social/taste-match";

type UserCardProps = {
  user: any;
  currentUserId?: string;
  match?: TasteMatchResult;
};

export async function UserCard({ user, currentUserId, match }: UserCardProps) {
  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <Link href={`/user/${user.username}`} className="flex items-center gap-4 min-w-0 flex-1 group">
            <Avatar src={user.avatarUrl} name={user.displayName} className="size-14 border border-border/50 shrink-0 transition-transform group-hover:scale-105" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold group-hover:underline truncate">{user.displayName}</h3>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              {user._count && (
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{user._count.library} watched</span>
                  <span>•</span>
                  <span>{user._count.reviews} reviews</span>
                </div>
              )}
            </div>
          </Link>
          
          {match && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 text-xs font-bold text-primary">
              {match.score}%
            </div>
          )}
        </div>

        {match?.tasteArchetype && (
          <div className="mt-3">
            <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {match.tasteArchetype}
            </span>
          </div>
        )}

        {match?.commonGenres && match.commonGenres.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Similar Taste</p>
            <div className="flex flex-wrap gap-1">
              {match.commonGenres.map(g => (
                <span key={g} className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        {currentUserId !== user.id ? (
          <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
        ) : (
          <div className="h-9" /> // spacer
        )}
      </div>
    </div>
  );
}
