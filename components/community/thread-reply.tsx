"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToThread } from "@/lib/community/actions";
import { Image as ImageIcon, Send, Loader2, AlertCircle } from "lucide-react";

const MAX_REPLY_LENGTH = 10000;
const MIN_REPLY_LENGTH = 2;

export function ThreadReply({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleQuote = (e: any) => {
      const { quoteText } = e.detail;
      setBody((prev) => prev + "\n" + quoteText);
      setErrorMessage(null);
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
      setErrorMessage("Please select a valid image file.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
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
      setErrorMessage("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (trimmed.length < MIN_REPLY_LENGTH) {
      setErrorMessage(`Reply must be at least ${MIN_REPLY_LENGTH} characters.`);
      return;
    }
    if (body.length > MAX_REPLY_LENGTH) {
      setErrorMessage(`Reply cannot exceed ${MAX_REPLY_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await replyToThread(threadId, body);
      setBody("");
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED" || err?.message?.includes("UNAUTHORIZED")) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      console.error(err);
      setErrorMessage(err?.message || "Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const trimmedLength = body.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_REPLY_LENGTH;
  const isTooLong = body.length > MAX_REPLY_LENGTH;
  const isSubmitDisabled = isSubmitting || isUploading || trimmedLength < MIN_REPLY_LENGTH || isTooLong;

  return (
    <div id="reply-box" className="mt-8 rounded-xl border border-border bg-card p-4">
      <h3 className="text-lg font-bold mb-4">Post a Reply</h3>

      {errorMessage && (
        <div className="flex items-center gap-2 mb-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-md">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

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
        onChange={(e) => {
          setBody(e.target.value);
          if (errorMessage) setErrorMessage(null);
        }}
        maxLength={MAX_REPLY_LENGTH}
        placeholder="Write your reply here..."
        className="min-h-[150px] rounded-t-none focus-visible:ring-0 border-t-0 bg-background resize-y"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          <span className={`${
            body.length > MAX_REPLY_LENGTH * 0.95
              ? body.length >= MAX_REPLY_LENGTH
                ? "text-destructive font-semibold"
                : "text-amber-500 font-medium"
              : "text-muted-foreground"
          }`}>
            {body.length.toLocaleString()} / {MAX_REPLY_LENGTH.toLocaleString()} characters
          </span>
          {isTooShort && (
            <span className="text-destructive">Minimum {MIN_REPLY_LENGTH} characters required</span>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? "Posting..." : "Post reply"}
        </Button>
      </div>
    </div>
  );
}
