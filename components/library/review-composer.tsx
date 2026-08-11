"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewComposer({ mediaId }: { mediaId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId,
        title: form.get("title"),
        body: form.get("body"),
        spoiler: form.get("spoiler") === "on",
        visibility: "PUBLIC",
      }),
    });
    if (response.ok) {
      event.currentTarget.reset();
      setMessage("Review published.");
      setOpen(false);
    } else {
      const body = await response.json();
      setMessage(body.error ?? "Could not publish review.");
    }
  }

  if (!open)
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Write a review
      </Button>
    );
  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <Input name="title" required maxLength={120} placeholder="A concise review title" />
      <textarea
        name="body"
        required
        minLength={20}
        maxLength={10000}
        placeholder="Share what you thought…"
        className="min-h-32 w-full rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <label className="flex items-center gap-2 text-sm">
        <input name="spoiler" type="checkbox" className="size-4 accent-primary" />
        Contains spoilers
      </label>
      <div className="flex gap-2">
        <Button type="submit">Publish review</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
    </form>
  );
}
