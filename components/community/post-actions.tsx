"use client";

import { Button } from "@/components/ui/button";
import { Quote, Reply, Flag } from "lucide-react";
import { LikeButton } from "@/components/community/like-button";

export function PostActions({
  postId,
  username,
  body,
  initialCount = 0,
  initialLiked = false,
}: {
  postId: string;
  username: string;
  body: string;
  initialCount?: number;
  initialLiked?: boolean;
}) {

  const handleQuote = () => {
    // Extract text from BBCode basicly or just pass raw BBCode
    const quoteText = `[quote]\n[b]${username} said:[/b]\n${body}\n[/quote]\n\n`;
    window.dispatchEvent(new CustomEvent("quotePost", { detail: { quoteText } }));
    
    // Scroll to reply box
    document.getElementById("reply-box")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReply = () => {
    document.getElementById("reply-box")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReport = () => {
    alert("Post reported for moderation.");
  };

  return (
    <div className="px-4 py-3 bg-transparent border-t border-border/20 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center text-xs text-muted-foreground">
        <button onClick={handleReport} className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
          <Flag className="w-3.5 h-3.5" /> Report
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <LikeButton postId={postId} initialCount={initialCount} initialLiked={initialLiked} />
        
        <Button onClick={handleQuote} variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground hover:text-foreground">
          <Quote className="w-3.5 h-3.5 mr-1.5" /> Quote
        </Button>
        <Button onClick={handleReply} variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground hover:text-foreground">
          <Reply className="w-3.5 h-3.5 mr-1.5" /> Reply
        </Button>
      </div>
    </div>
  );
}
