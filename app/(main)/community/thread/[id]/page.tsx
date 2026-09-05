import { notFound } from "next/navigation";
import { getThreadDetails } from "@/lib/community/queries";
import { ThreadReply } from "@/components/community/thread-reply";
import { BBCodeParser } from "@/components/community/bbcode-parser";
import { Avatar } from "@/components/ui/avatar";
import { PostActions } from "@/components/community/post-actions";
import { formatDistanceToNow, format } from "date-fns";
import { Search, Share2, Code, BookmarkPlus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [thread, supabase] = await Promise.all([
    getThreadDetails(id),
    createClient(),
  ]);

  if (!thread) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // Combine thread body (as post #1) and replies
  const posts = [
    {
      id: thread.id,
      user: thread.user,
      body: thread.body,
      createdAt: thread.createdAt,
      isStarter: true,
      reactionCount: thread.reactionCount,
      userLiked: thread.reactions?.some((r) => r.userId === currentUserId && r.reactionType === "LIKE") ?? false,
    },
    ...thread.posts.map((p) => ({
      id: p.id,
      user: p.user,
      body: p.body,
      createdAt: p.createdAt,
      isStarter: false,
      reactionCount: p.reactionCount,
      userLiked: p.reactions?.some((r) => r.userId === currentUserId && r.reactionType === "LIKE") ?? false,
    }))
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{thread.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Avatar name={thread.user.displayName || thread.user.username} src={thread.user.avatarUrl} className="w-5 h-5" />
            {thread.user.username}
          </span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
          {thread.mediaId && (
            <>
              <span>•</span>
              <Link href={`/media/${thread.mediaId}`} className="text-primary hover:underline">View Media</Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post, index) => (
          <div key={post.id} className="flex flex-col md:flex-row bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm" id={post.id}>
            
            {/* Left Sidebar (User Info) */}
            <div className="w-full md:w-[220px] bg-muted/30 p-4 flex flex-col items-center border-b md:border-b-0 md:border-r border-border/40 shrink-0">
              <Avatar name={post.user.displayName || post.user.username} src={post.user.avatarUrl} className="w-24 h-24 mb-3 ring-2 ring-primary/20" />
              <Link href={`/user/${post.user.username}`} className="font-bold text-primary hover:underline mb-1">
                {post.user.username}
              </Link>
              <div className="text-xs text-muted-foreground mb-3 text-center">Fan</div>
              
              {post.user.reputationScore > 50 && (
                <div className="w-full bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-500/30 text-amber-200 text-[10px] font-bold py-1 px-2 text-center rounded-sm uppercase tracking-wider mb-4 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  Elite Critic
                </div>
              )}

              <div className="w-full space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Joined</span>
                  <span className="text-foreground">{format(new Date(post.user.createdAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages</span>
                  <span className="text-foreground">{(post.user as any).messageCount || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reaction score</span>
                  <span className="text-foreground">{post.user.reputationScore}</span>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Post Header */}
              <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border/40 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <time title={format(new Date(post.createdAt), "PPpp")}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </time>
                </div>
                <div className="flex items-center gap-4">
                  <button className="hover:text-foreground flex items-center gap-1.5 transition-colors">
                    <Search className="w-3.5 h-3.5" /> Replies
                  </button>
                  <button className="hover:text-foreground transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="hover:text-foreground transition-colors">
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button className="hover:text-foreground transition-colors">
                    <BookmarkPlus className="w-3.5 h-3.5" />
                  </button>
                  <Link href={`#${post.id}`} className="text-primary hover:underline font-medium">
                    #{index + 1}
                  </Link>
                </div>
              </div>

              {/* Post Body */}
              <div className="flex-1 p-5 overflow-hidden">
                <BBCodeParser content={post.body} />
              </div>

              {/* Post Footer */}
              <PostActions
                postId={post.id}
                username={post.user.username}
                body={post.body}
                initialCount={post.reactionCount}
                initialLiked={post.userLiked}
              />
            </div>
          </div>
        ))}
      </div>

      {thread.locked ? (
        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-center text-muted-foreground">
          <p className="font-semibold text-foreground">This thread is locked</p>
          <p className="mt-1 text-sm">New replies can no longer be posted to this thread.</p>
        </div>
      ) : (
        <ThreadReply threadId={thread.id} />
      )}
    </div>
  );
}
