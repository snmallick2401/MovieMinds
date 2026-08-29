"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToThread } from "@/lib/community/actions";
import { Image as ImageIcon, Send } from "lucide-react";

export function ThreadReply({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleUpload = (e: any) => {
      const { bbcode } = e.detail;
      setBody((prev) => prev + "\n" + bbcode);
    };

    const handleQuote = (e: any) => {
      const { quoteText } = e.detail;
      setBody((prev) => prev + "\n" + quoteText);
    };

    window.addEventListener("imgUploaded", handleUpload);
    window.addEventListener("quotePost", handleQuote);
    return () => {
      window.removeEventListener("imgUploaded", handleUpload);
      window.removeEventListener("quotePost", handleQuote);
    };
  }, []);

  const handleOpenUploader = () => {
    if (typeof window !== "undefined" && (window as any).ImgUpload) {
      (window as any).ImgUpload.open();
    } else {
      alert("Image uploader is still loading or unavailable.");
    }
  };

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      await replyToThread(threadId, body);
      setBody("");
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED" || err?.message?.includes("UNAUTHORIZED")) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      console.error(err);
      alert("Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="reply-box" className="mt-8 rounded-xl border border-border bg-card p-4">
      <Script src="https://goonbox.cr/assets/plugin.js" strategy="lazyOnload" data-auto-inject="false" />
      <h3 className="text-lg font-bold mb-4">Post a Reply</h3>
      
      <div className="flex gap-2 mb-2 p-2 bg-muted/50 rounded-t-md border border-b-0 border-border">
        <Button variant="ghost" size="sm" onClick={handleOpenUploader} type="button" className="h-8">
          <ImageIcon className="w-4 h-4 mr-2" />
          Upload Images
        </Button>
      </div>
      
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply here..."
        className="min-h-[150px] rounded-t-none focus-visible:ring-0 border-t-0 bg-background resize-y"
      />
      
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting || !body.trim()}>
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? "Posting..." : "Post reply"}
        </Button>
      </div>
    </div>
  );
}
