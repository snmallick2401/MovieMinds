"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Eye, ExternalLink, Download } from "lucide-react";

export function ResponsiveGallery({ attachments }: { attachments: any[] }) {
  if (!attachments || attachments.length === 0) return null;

  const count = attachments.length;

  // Single Image
  if (count === 1) {
    const a = attachments[0];
    return (
      <div className="relative w-full overflow-hidden rounded-xl bg-muted border border-border/50 my-4 group cursor-pointer aspect-video sm:aspect-auto sm:max-h-[600px] flex items-center justify-center">
        <Image
          src={a.thumbUrl}
          alt="Gallery image"
          fill
          className="object-contain"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="size-8 text-white" />
        </div>
      </div>
    );
  }

  // 2 Images
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 my-4">
        {attachments.map((a) => (
          <div key={a.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-border/50 group cursor-pointer">
            <Image src={a.thumbUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
          </div>
        ))}
      </div>
    );
  }

  // 3 Images
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-2 my-4 h-[300px] sm:h-[400px]">
        <div className="relative h-full overflow-hidden rounded-xl bg-muted border border-border/50 group cursor-pointer">
          <Image src={attachments[0].thumbUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
        </div>
        <div className="grid grid-rows-2 gap-2 h-full">
          {attachments.slice(1).map((a) => (
            <div key={a.id} className="relative h-full overflow-hidden rounded-xl bg-muted border border-border/50 group cursor-pointer">
              <Image src={a.thumbUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4+ Images
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-4">
      {attachments.slice(0, 5).map((a, i) => {
        const isLast = i === 4;
        const remaining = count - 5;
        return (
          <div key={a.id} className={cn(
            "relative aspect-square overflow-hidden rounded-xl bg-muted border border-border/50 group cursor-pointer",
            i === 0 && count === 4 ? "col-span-2 row-span-2 aspect-auto" : ""
          )}>
            <Image src={a.thumbUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
            {isLast && remaining > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-xl">+{remaining}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RichContent({ content, attachments }: { content: string, attachments: any[] }) {
  // A very simple regex-based parser for demonstration.
  // In production, we would use marked + DOMPurify or a custom Markdown AST parser.
  
  const parseContent = (text: string) => {
    // Basic escapes
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    
    // Blockquote
    html = html.replace(/^> (.*$)/gim, "<blockquote class='border-l-4 border-primary/50 bg-muted/20 pl-4 py-2 my-4 text-muted-foreground italic rounded-r-lg'>$1</blockquote>");
    
    return html;
  };

  const blocks = content.split(/(\[spoiler\][\s\S]*?\[\/spoiler\]|\[gallery[\s\S]*?\])/g);

  return (
    <div className="whitespace-pre-wrap break-words">
      {blocks.map((block, idx) => {
        if (block.startsWith("[spoiler]") && block.endsWith("[/spoiler]")) {
          const spoilerText = block.slice(9, -10);
          return (
            <SpoilerBlock key={idx}>
              <span dangerouslySetInnerHTML={{ __html: parseContent(spoilerText) }} />
            </SpoilerBlock>
          );
        }

        if (block.startsWith("[gallery")) {
          // Extract IDs [gallery:id1,id2]
          const match = block.match(/\[gallery:(.*?)\]/);
          if (match) {
            const ids = match[1].split(",").map(s => s.trim());
            const matchedAttachments = ids.map(id => attachments.find(a => a.imageId === id)).filter(Boolean);
            return <ResponsiveGallery key={idx} attachments={matchedAttachments} />;
          }
          // If no specific IDs, just show all
          return <ResponsiveGallery key={idx} attachments={attachments} />;
        }

        return <span key={idx} dangerouslySetInnerHTML={{ __html: parseContent(block) }} />;
      })}
    </div>
  );
}

function SpoilerBlock({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span 
      onClick={() => setRevealed(true)}
      className={cn(
        "cursor-pointer rounded px-1 py-0.5 transition-all duration-300",
        revealed ? "bg-muted/50" : "bg-foreground text-transparent hover:bg-foreground/80"
      )}
      title={revealed ? "" : "Click to reveal spoiler"}
    >
      {children}
    </span>
  );
}
