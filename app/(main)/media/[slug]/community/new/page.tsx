"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 255;
const MIN_BODY_LENGTH = 10;
const MAX_BODY_LENGTH = 20000;

// Note: In Next.js 15 App Router, `params` should be awaited or unwrapped if used as Promise in Server Components. 
// For Client Components passing promises from layouts/pages, we `use()` it.
export default function NewThreadPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      setErrorMessage(`Title must be at least ${MIN_TITLE_LENGTH} characters.`);
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      setErrorMessage(`Title cannot exceed ${MAX_TITLE_LENGTH} characters.`);
      return;
    }
    if (trimmedBody.length < MIN_BODY_LENGTH) {
      setErrorMessage(`Opening post must be at least ${MIN_BODY_LENGTH} characters.`);
      return;
    }
    if (body.length > MAX_BODY_LENGTH) {
      setErrorMessage(`Opening post cannot exceed ${MAX_BODY_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/media/${params.slug}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, body: trimmedBody, spoiler }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create thread");
      }
      
      const { thread } = await res.json();
      router.push(`/media/${params.slug}/community/${thread.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Something went wrong creating the thread.");
      setIsSubmitting(false);
    }
  };

  const trimmedTitleLength = title.trim().length;
  const isTitleTooShort = trimmedTitleLength > 0 && trimmedTitleLength < MIN_TITLE_LENGTH;
  const isTitleTooLong = title.length > MAX_TITLE_LENGTH;

  const trimmedBodyLength = body.trim().length;
  const isBodyTooShort = trimmedBodyLength > 0 && trimmedBodyLength < MIN_BODY_LENGTH;
  const isBodyTooLong = body.length > MAX_BODY_LENGTH;

  const isSubmitDisabled =
    isSubmitting ||
    trimmedTitleLength < MIN_TITLE_LENGTH ||
    isTitleTooLong ||
    trimmedBodyLength < MIN_BODY_LENGTH ||
    isBodyTooLong;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:px-8">
      <Link 
        href={`/media/${params.slug}/community`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        Back to Discussions
      </Link>

      <h1 className="text-3xl font-bold mb-8">Start a New Discussion</h1>

      {errorMessage && (
        <div className="flex items-center gap-2 mb-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg">
          <AlertCircle className="size-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="title" className="text-sm font-semibold">Thread Title</label>
            <span className={`text-xs ${
              title.length > MAX_TITLE_LENGTH * 0.9
                ? isTitleTooLong
                  ? "text-destructive font-semibold"
                  : "text-amber-500 font-medium"
                : "text-muted-foreground"
            }`}>
              {title.length} / {MAX_TITLE_LENGTH}
            </span>
          </div>
          <input 
            id="title"
            type="text" 
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="What do you want to discuss?"
            className="w-full rounded-md border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
            maxLength={MAX_TITLE_LENGTH}
          />
          {isTitleTooShort && (
            <p className="text-xs text-destructive">Title must be at least {MIN_TITLE_LENGTH} characters.</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="body" className="text-sm font-semibold">Opening Post</label>
            <span className={`text-xs ${
              body.length > MAX_BODY_LENGTH * 0.95
                ? isBodyTooLong
                  ? "text-destructive font-semibold"
                  : "text-amber-500 font-medium"
                : "text-muted-foreground"
            }`}>
              {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Supports basic Markdown. E.g. **bold**, *italic*, [spoiler]secret[/spoiler]</p>
          <textarea 
            id="body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Share your thoughts..."
            className="w-full min-h-[250px] rounded-md border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            required
            maxLength={MAX_BODY_LENGTH}
          />
          {isBodyTooShort && (
            <p className="text-xs text-destructive">Opening post must be at least {MIN_BODY_LENGTH} characters.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="spoiler" 
            checked={spoiler}
            onChange={(e) => setSpoiler(e.target.checked)}
            className="rounded border-border bg-card text-primary focus:ring-primary"
          />
          <label htmlFor="spoiler" className="text-sm font-medium">
            Contains major spoilers for this title
          </label>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitDisabled} className="gap-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Post Discussion
          </Button>
        </div>
      </form>
    </div>
  );
}
