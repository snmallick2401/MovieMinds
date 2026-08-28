import React from "react";
import Image from "next/image";

export function BBCodeParser({ content }: { content: string }) {
  // A very basic BBCode parser for React
  const parts = content.split(/(\[url=.*?\][\s\S]*?\[\/url\]|\[img\].*?\[\/img\]|\[b\].*?\[\/b\]|\[i\].*?\[\/i\]|\[quote\][\s\S]*?\[\/quote\]|\n)/gi);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part === "\n") return <br key={i} />;

        const urlMatch = part.match(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/i);
        if (urlMatch) {
          return (
            <a key={i} href={urlMatch[1]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              <BBCodeParser content={urlMatch[2]} />
            </a>
          );
        }
        
        const imgMatch = part.match(/\[img\](.*?)\[\/img\]/i);
        if (imgMatch) {
          return (
            <div key={i} className="my-4 relative rounded-xl overflow-hidden border border-border/50 max-w-full inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgMatch[1]} alt="User uploaded content" className="max-w-full max-h-[600px] object-contain" loading="lazy" />
            </div>
          );
        }

        const bMatch = part.match(/\[b\](.*?)\[\/b\]/i);
        if (bMatch) {
          return <strong key={i} className="font-bold">{bMatch[1]}</strong>;
        }

        const iMatch = part.match(/\[i\](.*?)\[\/i\]/i);
        if (iMatch) {
          return <em key={i} className="italic">{iMatch[1]}</em>;
        }

        const quoteMatch = part.match(/\[quote\]([\s\S]*?)\[\/quote\]/i);
        if (quoteMatch) {
          return (
            <blockquote key={i} className="my-3 border-l-4 border-primary/50 bg-muted/50 p-3 rounded-r-md text-muted-foreground italic text-sm">
              <BBCodeParser content={quoteMatch[1]} />
            </blockquote>
          );
        }

        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </div>
  );
}
