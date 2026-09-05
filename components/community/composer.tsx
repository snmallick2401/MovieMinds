"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Send, Loader2, Bold, Italic, Link as LinkIcon, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_REPLY_LENGTH = 10000;
const MIN_REPLY_LENGTH = 2;

export function ThreadComposer({ threadId, userId }: { threadId: string; userId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = "") => {
    setContent(prev => prev + before + after);
    setErrorMessage(null);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/uploads/goonbox", {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      // Insert gallery syntax
      setContent(prev => prev + `\n[gallery:${data.imageId}]\n`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleImageUpload(e.clipboardData.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const submitReply = async () => {
    const trimmed = content.trim();
    if (trimmed.length < MIN_REPLY_LENGTH) {
      setErrorMessage(`Reply must be at least ${MIN_REPLY_LENGTH} characters.`);
      return;
    }
    if (content.length > MAX_REPLY_LENGTH) {
      setErrorMessage(`Reply cannot exceed ${MAX_REPLY_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/discussions/${threadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: content }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to post reply");
      }
      
      setContent("");
      window.location.reload(); // Quick refresh to show new post
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong posting your reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const trimmedLength = content.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_REPLY_LENGTH;
  const isTooLong = content.length > MAX_REPLY_LENGTH;
  const isSubmitDisabled = isSubmitting || isUploading || trimmedLength < MIN_REPLY_LENGTH || isTooLong;

  return (
    <div 
      className="rounded-xl border border-border bg-card overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-all shadow-sm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border/50 bg-muted/20 p-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => insertText("[b]", "[/b]")} title="Bold">
          <Bold className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => insertText("[i]", "[/i]")} title="Italic">
          <Italic className="size-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => insertText("[url=]", "[/url]")} title="Link">
          <LinkIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => insertText("[spoiler]", "[/spoiler]")} title="Spoiler">
          <AlertTriangle className="size-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-foreground" 
          title="Upload Image"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm px-4 py-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Editor Area */}
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (errorMessage) setErrorMessage(null);
        }}
        onPaste={onPaste}
        maxLength={MAX_REPLY_LENGTH}
        placeholder="Write your reply here... (Supports Markdown, paste/drag images to upload)"
        className="w-full min-h-[150px] resize-y bg-transparent p-4 text-sm sm:text-base outline-none placeholder:text-muted-foreground"
      />

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/10 p-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            Posts are formatted with Markdown. Drag and drop images to upload.
          </span>
          <span className={`${
            content.length > MAX_REPLY_LENGTH * 0.95
              ? content.length >= MAX_REPLY_LENGTH
                ? "text-destructive font-semibold"
                : "text-amber-500 font-medium"
              : "text-muted-foreground"
          }`}>
            {content.length.toLocaleString()} / {MAX_REPLY_LENGTH.toLocaleString()} characters
          </span>
          {isTooShort && (
            <span className="text-destructive">Minimum {MIN_REPLY_LENGTH} characters required</span>
          )}
        </div>
        <Button 
          onClick={submitReply}
          disabled={isSubmitDisabled} 
          className="gap-2 ml-auto"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Post Reply
        </Button>
      </div>
    </div>
  );
}
