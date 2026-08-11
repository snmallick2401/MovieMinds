"use client";

import { Eye, PenLine, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReviewItem } from "@/types/review";

type Draft = { title: string; body: string; spoiler: boolean };
const emptyDraft: Draft = { title: "", body: "", spoiler: false };

export function ReviewEditor({
  mediaId,
  review,
  onSaved,
  onDeleted,
  onCancel,
}: {
  mediaId: string;
  review?: ReviewItem | null;
  onSaved: (review: ReviewItem) => void;
  onDeleted: (id: string) => void;
  onCancel?: () => void;
}) {
  const draftKey = `movieminds:review-draft:${mediaId}`;
  const [draft, setDraft] = useState<Draft>(
    review
      ? { title: review.title ?? "", body: review.body, spoiler: review.spoiler }
      : emptyDraft,
  );
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (review) return;
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      setDraft(JSON.parse(saved) as Draft);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey, review]);
  useEffect(() => {
    if (!review && draft.body.trim())
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draft, draftKey, review]);
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const response = await fetch(review ? `/api/reviews/${review.id}` : "/api/reviews", {
      method: review ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId,
        title: draft.title || null,
        body: draft.body,
        spoiler: draft.spoiler,
        visibility: "PUBLIC",
      }),
    });
    const payload = (await response.json()) as { review?: ReviewItem; error?: string };
    setSubmitting(false);
    if (!response.ok || !payload.review) {
      setMessage(payload.error ?? "Could not save review.");
      return;
    }
    window.localStorage.removeItem(draftKey);
    onSaved(payload.review);
  }
  async function remove() {
    if (!review || !window.confirm("Delete this review? This cannot be undone.")) return;
    setSubmitting(true);
    const response = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
    setSubmitting(false);
    if (response.ok) {
      onDeleted(review.id);
      return;
    }
    setMessage("Could not delete review.");
  }
  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <PenLine className="size-5 text-primary" />
          {review ? "Edit your review" : "Write a review"}
        </h2>
        <button
          type="button"
          onClick={() => setPreview((value) => !value)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {preview ? <PenLine className="size-4" /> : <Eye className="size-4" />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="mt-5 rounded-lg border border-border bg-background/60 p-4">
          <h3 className="font-semibold">{draft.title || "Untitled review"}</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {draft.body || "Nothing to preview yet."}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <Input
            value={draft.title}
            onChange={(event) => change("title", event.target.value)}
            maxLength={120}
            placeholder="Headline (optional)"
            aria-label="Review headline"
          />
          <textarea
            value={draft.body}
            onChange={(event) => change("body", event.target.value)}
            minLength={20}
            maxLength={10000}
            required
            placeholder="What did you think? Markdown-style paragraphs are preserved."
            aria-label="Review text"
            className="min-h-40 w-full rounded-lg border border-border bg-background p-3 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.spoiler}
                onChange={(event) => change("spoiler", event.target.checked)}
                className="size-4 accent-primary"
              />
              Contains spoilers
            </label>
            <span>{draft.body.length.toLocaleString()} / 10,000</span>
          </div>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={submitting || draft.body.trim().length < 20}>
          <Save className="size-4" />
          {submitting ? "Saving…" : review ? "Update review" : "Publish review"}
        </Button>
        {review && (
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={remove}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      {message && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
