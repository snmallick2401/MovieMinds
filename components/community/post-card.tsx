import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { RichContent } from "./rich-content";
import { ReactionBar } from "./reaction-bar";

export function PostCard({
  post,
  isOriginalPost = false,
  currentUserReaction = undefined,
}: {
  post: any;
  isOriginalPost?: boolean;
  currentUserReaction?: string;
}) {
  const isEdited = post.editedAt !== null;

  return (
    <div className={`flex flex-col sm:flex-row gap-0 sm:gap-6 rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm ${isOriginalPost ? 'border-primary/20' : ''}`}>
      {/* Left Sidebar (Classic Forum Style) */}
      <div className="w-full sm:w-48 sm:shrink-0 bg-muted/20 p-4 border-b sm:border-b-0 sm:border-r border-border/50 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-3">
        <Link href={`/user/${post.user.username}`} className="block relative">
          <Avatar src={post.user.avatarUrl} name={post.user.displayName} className="size-12 sm:size-16 ring-2 ring-background shadow-md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/user/${post.user.username}`} className="font-bold text-foreground hover:text-primary transition-colors block truncate">
            {post.user.displayName}
          </Link>
          
          <div className="mt-1 flex flex-wrap sm:flex-col gap-1 sm:gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
              {post.user.reputationScore > 100 ? "Cinephile" : "Member"}
            </span>
            <div className="text-xs text-muted-foreground flex gap-3 sm:flex-col sm:gap-1 mt-1">
              <span>Rep: <strong className="text-foreground">{post.user.reputationScore || 0}</strong></span>
              <span>Posts: <strong className="text-foreground">{post.user._count?.discussionPosts || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-3 border-b border-border/40">
          <time dateTime={new Date(post.createdAt).toISOString()}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </time>
          <div className="flex items-center gap-4">
            {isEdited && post.editedAt && <span>Edited {formatDistanceToNow(new Date(post.editedAt), { addSuffix: true })}</span>}
            <span className="opacity-50">#{post.id.slice(-5)}</span>
          </div>
        </div>
        
        <div className="flex-1 text-sm sm:text-base leading-relaxed text-foreground/90">
          <RichContent content={post.body} attachments={post.attachments || []} />
        </div>

        {/* Action Bar */}
        <div className="mt-6 pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-border/40">
          <ReactionBar 
            postId={post.id} 
            initialReactions={post.reactions || []} 
            userReactionType={currentUserReaction} 
          />
          <div className="flex items-center gap-4">
            <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Quote
            </button>
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="size-4" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
