"use client";

import { ChevronDown, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SpoilerToggle } from "@/components/reviews/spoiler-toggle";
import type { ReviewItem } from "@/types/review";

function relativeTime(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ReviewCard({
  review,
  isOwner = false,
  onEdit,
  onDelete,
}: {
  review: ReviewItem;
  isOwner?: boolean;
  onEdit?: (review: ReviewItem) => void;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const long = review.body.length > 600;
  const content = !long || expanded ? review.body : `${review.body.slice(0, 600)}…`;
  async function remove() {
    if (!onDelete || !window.confirm("Delete this review? This cannot be undone."))
      return;
    setDeleting(true);
    await onDelete(review.id);
  }
  const body = (
    <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
      {content}
    </p>
  );
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={review.author.displayName} src={review.author.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold">{review.author.displayName}</p>
            <span className="text-sm text-muted-foreground">
              @{review.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              · {relativeTime(review.createdAt)}
            </span>
            {review.editedAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
          {review.rating !== null && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
              <Star className="size-3 fill-current" />
              {review.rating.toFixed(1)} / 10
            </span>
          )}
        </div>
        {isOwner && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit review"
              onClick={() => onEdit?.(review)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete review"
              disabled={deleting}
              onClick={remove}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
      {review.title && <h3 className="mt-5 text-lg font-semibold">{review.title}</h3>}
      <div className="mt-3">
        {review.spoiler ? <SpoilerToggle>{body}</SpoilerToggle> : body}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown
            className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </article>
  );
}
