import React from "react";

/**
 * Validates and sanitizes URLs to strictly allow safe protocols (http, https, and internal relative paths),
 * preventing Stored Cross-Site Scripting (XSS) via javascript:, data:, or vbscript: schemes.
 */
function sanitizeUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim().replace(/^[\x00-\x1F\x7F\s]+/g, "");

  // Explicitly deny dangerous schemes
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  // Safe internal relative path (must not be protocol-relative // or contain backslash /\)
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("\\")) {
      return null;
    }
    return trimmed;
  }

  // Parse absolute URL and ensure http or https protocol only
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Validates image URLs to ensure they only use http or https protocols.
 */
function sanitizeImageUrl(rawUrl: string): string | null {
  const sanitized = sanitizeUrl(rawUrl);
  if (!sanitized) return null;
  try {
    const parsed = new URL(sanitized, "http://localhost");
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return sanitized;
    }
  } catch {
    return null;
  }
  return null;
}

const MAX_BBCODE_DEPTH = 3;

export function BBCodeParser({
  content,
  depth = 0,
}: {
  content: string;
  depth?: number;
}) {
  if (depth > MAX_BBCODE_DEPTH) {
    return <React.Fragment>{content}</React.Fragment>;
  }

  // A basic BBCode parser for React
  const parts = content.split(
    /(\[url=.*?\][\s\S]*?\[\/url\]|\[img\].*?\[\/img\]|\[b\].*?\[\/b\]|\[i\].*?\[\/i\]|\[quote\][\s\S]*?\[\/quote\]|\n)/gi,
  );

  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part === "\n") return <br key={i} />;

        const urlMatch = part.match(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/i);
        if (urlMatch) {
          const rawTarget = urlMatch[1];
          const innerText = urlMatch[2];
          const safeHref = sanitizeUrl(rawTarget);

          if (safeHref) {
            return (
              <a
                key={i}
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <BBCodeParser content={innerText} depth={depth + 1} />
              </a>
            );
          }

          // If URL is unsafe/malicious (e.g. javascript:), render text content safely without a link
          return <BBCodeParser key={i} content={innerText} depth={depth + 1} />;
        }

        const imgMatch = part.match(/\[img\](.*?)\[\/img\]/i);
        if (imgMatch) {
          const safeImgSrc = sanitizeImageUrl(imgMatch[1]);
          if (!safeImgSrc) {
            return null;
          }

          return (
            <div
              key={i}
              className="my-4 relative rounded-xl overflow-hidden border border-border/50 max-w-full inline-block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safeImgSrc}
                alt="User uploaded content"
                className="max-w-full max-h-[600px] object-contain"
                loading="lazy"
              />
            </div>
          );
        }

        const bMatch = part.match(/\[b\](.*?)\[\/b\]/i);
        if (bMatch) {
          return (
            <strong key={i} className="font-bold">
              {bMatch[1]}
            </strong>
          );
        }

        const iMatch = part.match(/\[i\](.*?)\[\/i\]/i);
        if (iMatch) {
          return (
            <em key={i} className="italic">
              {iMatch[1]}
            </em>
          );
        }

        const quoteMatch = part.match(/\[quote\]([\s\S]*?)\[\/quote\]/i);
        if (quoteMatch) {
          return (
            <blockquote
              key={i}
              className="my-3 border-l-4 border-primary/50 bg-muted/50 p-3 rounded-r-md text-muted-foreground italic text-sm"
            >
              <BBCodeParser content={quoteMatch[1]} depth={depth + 1} />
            </blockquote>
          );
        }

        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </div>
  );
}
