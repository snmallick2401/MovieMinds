import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Share2, Flag, Eye } from "lucide-react";
import { findMediaBySlugOrId } from "@/lib/media/queries";
import { getThreadById, getThreadPosts } from "@/lib/discussions/queries";
import { PostCard } from "@/components/community/post-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ThreadComposer } from "@/components/community/composer";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; threadId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug, threadId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [media, thread, postsData, supabase] = await Promise.all([
    findMediaBySlugOrId(slug),
    getThreadById(threadId),
    getThreadPosts(threadId, page, 20),
    createClient(),
  ]);

  if (!media || !thread) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isOriginalPostPage = page === 1;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:px-8">
      {/* Thread Header */}
      <div>
        <Link 
          href={`/media/${media.slug || slug}/community`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="size-4" />
          Back to Discussions
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {thread.pinned && <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">Pinned</span>}
              {thread.locked && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-500">Locked</span>}
              {thread.spoiler && <span className="rounded bg-destructive/20 px-2 py-0.5 text-xs font-semibold text-destructive">Spoiler</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {thread.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Eye className="size-4" /> {thread.viewCount.toLocaleString()} Views</span>
              <span>{thread.replyCount.toLocaleString()} Replies</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="size-4" /> Share
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
              <Flag className="size-4" /> Report
            </Button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {/* Render Original Post artificially at the top if on page 1 */}
        {isOriginalPostPage && (
          <PostCard 
            isOriginalPost
            currentUserReaction={thread.reactions?.find((r: any) => r.userId === user?.id)?.reactionType}
            post={{
              id: thread.id,
              body: thread.body,
              createdAt: thread.createdAt,
              editedAt: thread.updatedAt,
              reactionCount: thread.reactionCount,
              user: thread.user,
              attachments: [], // Thread OP attachments logic can be added later if needed
              reactions: thread.reactions || [],
            }}
          />
        )}

        {/* Render Replies */}
        <div className="space-y-4">
          {postsData.items.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserReaction={post.reactions?.find((r: any) => r.userId === user?.id)?.reactionType}
            />
          ))}
        </div>
      </div>

      {/* Composer */}
      {thread.locked ? (
        <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6 text-center text-muted-foreground">
          <p className="font-semibold text-foreground">This thread is locked</p>
          <p className="mt-1 text-sm">New replies can no longer be posted to this thread.</p>
        </div>
      ) : user ? (
        <div className="mt-12">
          <h3 className="text-lg font-bold mb-4">Post a Reply</h3>
          <ThreadComposer threadId={thread.id} userId={user.id} />
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <h3 className="font-bold">Join the discussion</h3>
          <p className="mt-2 text-sm text-muted-foreground">You need to be signed in to reply to this thread.</p>
          <Link 
            href="/login" 
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Sign in to Reply
          </Link>
        </div>
      )}
    </div>
  );
}
