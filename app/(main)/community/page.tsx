import { getCommunityThreads } from "@/lib/community/queries";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye, TrendingUp, Sparkles, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const pageNum = parseInt(page || "1");
  const { threads, totalPages } = await getCommunityThreads(undefined, pageNum, 20);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Hash className="w-8 h-8 text-primary" />
            Community Forums
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Join the discussion, share theories, and review media.</p>
        </div>
        <Button>Create Thread</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button variant="secondary" size="sm" className="rounded-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> All Categories
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">General</Button>
        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">Spoilers</Button>
        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">Theories</Button>
        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">Recommendations</Button>
      </div>

      <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
        {threads.map((thread) => (
          <div key={thread.id} className="flex items-center gap-4 p-4 border-b border-border/40 hover:bg-muted/50 transition-colors last:border-0">
            <Avatar name={thread.user.displayName || thread.user.username} src={thread.user.avatarUrl} className="w-10 h-10 shrink-0" />
            
            <div className="flex-1 min-w-0">
              <Link href={`/community/thread/${thread.id}`} className="text-base font-semibold text-foreground hover:text-primary hover:underline line-clamp-1">
                {thread.title}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Link href={`/user/${thread.user.username}`} className="hover:text-foreground">{thread.user.username}</Link>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] uppercase font-bold text-muted-foreground/80">
                  {thread.category}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0 w-32 justify-end">
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-1.5 text-foreground"><MessageSquare className="w-3.5 h-3.5" /> {thread.replyCount}</span>
                <span className="text-[10px]">replies</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-1.5 text-foreground"><Eye className="w-3.5 h-3.5" /> {thread.viewCount}</span>
                <span className="text-[10px]">views</span>
              </div>
            </div>
          </div>
        ))}

        {threads.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No threads found. Be the first to start a discussion!
          </div>
        )}
      </div>
    </div>
  );
}
