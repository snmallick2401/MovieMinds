"use client";

import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewEditor } from "@/components/reviews/review-editor";
import { Button } from "@/components/ui/button";
import type { PaginatedReviews, ReviewItem } from "@/types/review";

export function ReviewList({
  data,
  mediaId,
  currentUserId,
}: {
  data: PaginatedReviews;
  mediaId: string;
  currentUserId: string | null;
}) {
  const [userReview, setUserReview] = useState(data.userReview);
  const [items, setItems] = useState(data.items);
  const [editing, setEditing] = useState(false);
  function save(review: ReviewItem) {
    setUserReview(review);
    setEditing(false);
  }
  async function remove(id: string) {
    const response = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (response.ok) {
      if (userReview?.id === id) setUserReview(null);
      setItems((current) => current.filter((item) => item.id !== id));
    }
  }
  const pageQuery = (page: number) => `/media/${mediaId}?reviewsPage=${page}#reviews`;
  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.stats.total.toLocaleString()} community review
            {data.stats.total === 1 ? "" : "s"}
            {data.stats.averageUserRating !== null &&
              ` · ${data.stats.averageUserRating.toFixed(1)} average member rating`}
          </p>
        </div>
        {currentUserId && !userReview && !editing && (
          <Button onClick={() => setEditing(true)}>
            <MessageSquarePlus className="size-4" />
            Write a review
          </Button>
        )}
      </div>
      {currentUserId && (editing || userReview) && (
        <div className="mt-6">
          {editing ? (
            <ReviewEditor
              mediaId={mediaId}
              review={userReview}
              onSaved={save}
              onDeleted={(id) => {
                if (userReview?.id === id) setUserReview(null);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            userReview && (
              <div>
                <p className="mb-3 text-sm font-semibold text-primary">Your review</p>
                <ReviewCard
                  review={userReview}
                  isOwner
                  onEdit={() => setEditing(true)}
                  onDelete={remove}
                />
              </div>
            )
          )}
        </div>
      )}
      <div className="mt-6 space-y-4">
        {items.length
          ? items.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isOwner={review.userId === currentUserId}
                onEdit={
                  review.userId === currentUserId
                    ? () => {
                        setUserReview(review);
                        setEditing(true);
                      }
                    : undefined
                }
                onDelete={review.userId === currentUserId ? remove : undefined}
              />
            ))
          : !userReview && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold">No reviews yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Be the first to share your perspective.
                </p>
              </div>
            )}
      </div>
      {data.totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-center gap-3"
          aria-label="Review pagination"
        >
          {data.page > 1 ? (
            <Link
              href={pageQuery(data.page - 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-3 py-2 text-sm opacity-50">
              Previous
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          {data.page < data.totalPages ? (
            <Link
              href={pageQuery(data.page + 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-3 py-2 text-sm opacity-50">
              Next
            </span>
          )}
        </nav>
      )}
    </section>
  );
}
