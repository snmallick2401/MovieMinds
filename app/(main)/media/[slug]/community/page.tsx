import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus, MessageCircle, Eye, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { findMediaBySlugOrId } from "@/lib/media/queries";
import { getDiscussionThreads, ThreadSort } from "@/lib/discussions/queries";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export default async function MediaCommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const media = await findMediaBySlugOrId(slug);
  if (!media) notFound();

  const sp = await searchParams;
  const sort = (sp.sort as ThreadSort) || "newest";
  const page = Math.max(1, Number(sp.page) || 1);

  const threads = await getDiscussionThreads({ mediaId: media.id, sort, page });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Community Discussions</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Join the conversation about {media.title}. Share theories, reviews, and discoveries.
          </p>
        </div>
        <Link href={`/media/${media.slug || media.id}/community/new`} className="shrink-0 gap-2 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          <MessageSquarePlus className="size-4" />
          New Thread
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {threads.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <MessageCircle className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No discussions yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Be the first to start a conversation about {media.title}!
            </p>
            <Link 
              href={`/media/${media.slug || media.id}/community/new`} 
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-transparent h-10 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Start a Thread
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {threads.items.map((thread) => (
              <div key={thread.id} className="group p-4 sm:p-6 transition-colors hover:bg-muted/30">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {thread.pinned && (
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">Pinned</span>
                      )}
                      {thread.spoiler && (
                        <span className="rounded bg-destructive/20 px-2 py-0.5 text-xs font-semibold text-destructive">Spoiler</span>
                      )}
                    </div>
                    <Link href={`/media/${media.slug || media.id}/community/${thread.id}`} className="block">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {thread.title}
                      </h3>
                    </Link>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar src={thread.user.avatarUrl} name={thread.user.displayName} className="size-5" />
                      <span className="truncate">{thread.user.displayName}</span>
                      <span>·</span>
                      <time dateTime={thread.createdAt.toISOString()}>
                        {formatDistanceToNow(thread.createdAt, { addSuffix: true })}
                      </time>
                    </div>
                  </div>
                  
                  <div className="flex shrink-0 items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex flex-col items-center sm:items-end">
                      <span className="font-semibold text-foreground">{thread.replyCount}</span>
                      <span className="text-xs flex items-center gap-1"><MessageCircle className="size-3" /> Replies</span>
                    </div>
                    <div className="flex flex-col items-center sm:items-end">
                      <span className="font-semibold text-foreground">{thread.viewCount}</span>
                      <span className="text-xs flex items-center gap-1"><Eye className="size-3" /> Views</span>
                    </div>
                    <div className="flex flex-col items-center sm:items-end">
                      <span className="font-semibold text-foreground">{thread.reactionCount}</span>
                      <span className="text-xs flex items-center gap-1"><ThumbsUp className="size-3" /> Reactions</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
