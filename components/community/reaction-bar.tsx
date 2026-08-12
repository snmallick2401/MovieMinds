"use client";

import { useState } from "react";
import { Smile, ThumbsUp, Heart, Flame, Zap, Laugh, Frown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { type: "LIKE", icon: ThumbsUp, label: "Like", color: "text-blue-500" },
  { type: "LOVE", icon: Heart, label: "Love", color: "text-pink-500" },
  { type: "FIRE", icon: Flame, label: "Fire", color: "text-orange-500" },
  { type: "MIND_BLOWN", icon: Zap, label: "Mind Blown", color: "text-purple-500" },
  { type: "FUNNY", icon: Laugh, label: "Funny", color: "text-yellow-500" },
  { type: "CRY", icon: Frown, label: "Cry", color: "text-blue-400" },
  { type: "AGREE", icon: CheckCircle2, label: "Agree", color: "text-green-500" },
];

export function ReactionBar({ postId, initialReactions, userReactionType }: { postId: string; initialReactions: any[]; userReactionType?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticReaction, setOptimisticReaction] = useState<string | undefined>(userReactionType);
  const [isPending, setIsPending] = useState(false);

  // Group initial reactions
  const counts = initialReactions.reduce((acc, r) => {
    acc[r.reactionType] = (acc[r.reactionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleReact = async (type: string) => {
    if (isPending) return;
    
    // Optimistic UI update
    const previous = optimisticReaction;
    const isRemoving = previous === type;
    setOptimisticReaction(isRemoving ? undefined : type);
    setIsOpen(false);
    setIsPending(true);

    try {
      const res = await fetch(`/api/discussions/posts/${postId}/react`, {
        method: isRemoving ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isRemoving ? undefined : JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setOptimisticReaction(previous);
      alert("Failed to react");
    } finally {
      setIsPending(false);
    }
  };

  // Adjust counts based on optimistic state
  if (userReactionType && userReactionType !== optimisticReaction) counts[userReactionType] = Math.max(0, (counts[userReactionType] || 1) - 1);
  if (optimisticReaction && userReactionType !== optimisticReaction) counts[optimisticReaction] = (counts[optimisticReaction] || 0) + 1;

  const activeReactions = Object.entries(counts as Record<string, number>).filter(([_, count]) => count > 0);

  return (
    <div className="relative flex items-center gap-2">
      {/* Reaction Picker Button */}
      <button 
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold transition-colors relative",
          optimisticReaction ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Smile className="size-4" />
        React
      </button>

      {/* Picker Popover */}
      {isOpen && (
        <div 
          onMouseLeave={() => setIsOpen(false)}
          className="absolute left-0 bottom-full mb-2 flex items-center gap-1 rounded-full border border-border/50 bg-card p-1 shadow-lg animate-in fade-in zoom-in-95 duration-200 z-10"
        >
          {REACTIONS.map((r) => {
            const Icon = r.icon;
            const isSelected = optimisticReaction === r.type;
            return (
              <button
                key={r.type}
                onClick={() => handleReact(r.type)}
                className={cn(
                  "p-2 rounded-full transition-transform hover:scale-110",
                  isSelected ? "bg-muted" : "hover:bg-muted/50",
                  r.color
                )}
                title={r.label}
              >
                <Icon className={cn("size-5", isSelected && "fill-current")} />
              </button>
            );
          })}
        </div>
      )}

      {/* Display active reactions */}
      {activeReactions.length > 0 && (
        <div className="flex items-center gap-1 ml-2">
          {activeReactions.map(([type, count]) => {
            const config = REACTIONS.find(r => r.type === type);
            if (!config) return null;
            const Icon = config.icon;
            const isUserSelected = type === optimisticReaction;
            
            return (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors border",
                  isUserSelected 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                )}
                title={config.label}
              >
                <Icon className={cn("size-3", config.color)} />
                {count}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
