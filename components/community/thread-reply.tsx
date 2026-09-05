"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToThread } from "@/lib/community/actions";
import { Image as ImageIcon, Send, Loader2 } from "lucide-react";

export function ThreadReply({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleQuote = (e: any) => {
      const { quoteText } = e.detail;
      setBody((prev) => prev + "\n" + quoteText);
    };

    window.addEventListener("quotePost", handleQuote);
    return () => {
      window.removeEventListener("quotePost", handleQuote);
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads/goonbox", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        throw new Error("Upload failed");
      }

      const data = await res.json();
      if (data.imageUrl) {
        setBody((prev) => `${prev.trim()}\n[img]${data.imageUrl}[/img]\n`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      <h3 className="text-lg font-bold mb-4">Post a Reply</h3>

      <div className="flex gap-2 mb-2 p-2 bg-muted/50 rounded-t-md border border-b-0 border-border">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          disabled={isUploading}
          className="h-8"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4 mr-2" />
          )}
          {isUploading ? "Uploading..." : "Upload Image"}
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
