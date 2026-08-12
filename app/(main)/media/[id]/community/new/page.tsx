"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Note: In Next.js 15 App Router, `params` should be awaited or unwrapped if used as Promise in Server Components. 
// For Client Components passing promises from layouts/pages, we `use()` it.
export default function NewThreadPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/media/${params.id}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, spoiler }),
      });
      
      if (!res.ok) throw new Error("Failed to create thread");
      
      const { thread } = await res.json();
      router.push(`/media/${params.id}/community/${thread.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating the thread.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:px-8">
      <Link 
        href={`/media/${params.id}/community`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        Back to Discussions
      </Link>

      <h1 className="text-3xl font-bold mb-8">Start a New Discussion</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold">Thread Title</label>
          <input 
            id="title"
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to discuss?"
            className="w-full rounded-md border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-semibold">Opening Post</label>
          <p className="text-xs text-muted-foreground mb-2">Supports basic Markdown. E.g. **bold**, *italic*, [spoiler]secret[/spoiler]</p>
          <textarea 
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[250px] rounded-md border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            required
          />
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
          <Button type="submit" disabled={isSubmitting || !title.trim() || !body.trim()} className="gap-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Post Discussion
          </Button>
        </div>
      </form>
    </div>
  );
}
