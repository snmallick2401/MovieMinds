"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Send, Loader2, Bold, Italic, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThreadComposer({ threadId, userId }: { threadId: string; userId: string }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = "") => {
    // In a real implementation, this would grab textarea selection start/end and insert between them
    setContent(prev => prev + before + after);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/uploads/goonbox", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      // Insert gallery syntax
      setContent(prev => prev + `\n[gallery:${data.imageId}]\n`);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Please try again.");
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
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/discussions/${threadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: content }),
      });
      
      if (!res.ok) throw new Error("Failed to post reply");
      
      setContent("");
      window.location.reload(); // Quick refresh to show new post
    } catch (err) {
      console.error(err);
      alert("Something went wrong posting your reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="rounded-xl border border-border bg-card overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-all shadow-sm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border/50 bg-muted/20 p-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => insertText("**", "**")} title="Bold">
          <Bold className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => insertText("*", "*")} title="Italic">
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

      {/* Editor Area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={onPaste}
        placeholder="Write your reply here... (Supports Markdown, paste/drag images to upload)"
        className="w-full min-h-[150px] resize-y bg-transparent p-4 text-sm sm:text-base outline-none placeholder:text-muted-foreground"
      />

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/50 bg-muted/10 p-3">
        <p className="text-xs text-muted-foreground hidden sm:block">
          Posts are formatted with Markdown. Drag and drop images to upload.
        </p>
        <Button 
          onClick={submitReply}
          disabled={isSubmitting || !content.trim()} 
          className="gap-2 ml-auto"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Post Reply
        </Button>
      </div>
    </div>
  );
}
