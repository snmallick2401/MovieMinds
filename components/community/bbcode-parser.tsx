"use client";

import React, { useState } from "react";
import { ResponsiveGallery } from "./responsive-gallery";

/**
 * Validates and sanitizes URLs to strictly allow safe protocols (http, https, and internal relative paths),
 * preventing Stored Cross-Site Scripting (XSS) via javascript:, data:, or vbscript: schemes.
 */
export function sanitizeUrl(rawUrl: string): string | null {
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
export function sanitizeImageUrl(rawUrl: string): string | null {
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

const MAX_BBCODE_DEPTH = 10;
const MAX_TAG_SPAN = 500;

const KNOWN_TAGS = new Set([
  "b",
  "i",
  "u",
  "s",
  "quote",
  "spoiler",
  "url",
  "img",
  "code",
  "gallery",
]);

interface Token {
  type: "open" | "close" | "self-closing" | "text" | "newline";
  tag?: string;
  value?: string;
  raw: string;
}

/**
 * Linear-time non-backtracking tokenizer ($O(N)$).
 * Scans character-by-character without regular expressions, preventing ReDoS.
 */
function tokenizeBBCode(content: string): Token[] {
  const tokens: Token[] = [];
  const len = content.length;
  let i = 0;

  while (i < len) {
    const ch = content[i];

    if (ch === "\n") {
      tokens.push({ type: "newline", raw: "\n" });
      i++;
      continue;
    }

    if (ch === "[") {
      const closeIdx = content.indexOf("]", i + 1);
      if (closeIdx !== -1 && closeIdx - i <= MAX_TAG_SPAN) {
        const between = content.slice(i + 1, closeIdx);
        // If there's another '[' between, the first '[' is plain text
        if (!between.includes("[")) {
          const trimmed = between.trim();

          // 1. Closing tag [/tag]
          if (trimmed.startsWith("/")) {
            const tagName = trimmed.slice(1).trim().toLowerCase();
            if (KNOWN_TAGS.has(tagName)) {
              tokens.push({
                type: "close",
                tag: tagName,
                raw: content.slice(i, closeIdx + 1),
              });
              i = closeIdx + 1;
              continue;
            }
          }

          // 2. Gallery tag [gallery:id1,id2] or [gallery]
          if (trimmed.toLowerCase().startsWith("gallery")) {
            let value = "";
            if (trimmed.includes(":")) {
              value = trimmed.slice(trimmed.indexOf(":") + 1).trim();
            }
            tokens.push({
              type: "self-closing",
              tag: "gallery",
              value,
              raw: content.slice(i, closeIdx + 1),
            });
            i = closeIdx + 1;
            continue;
          }

          // 3. Opening tag with attribute [tag=val]
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const tagName = trimmed.slice(0, eqIdx).trim().toLowerCase();
            let tagVal = trimmed.slice(eqIdx + 1).trim();
            if (
              (tagVal.startsWith('"') && tagVal.endsWith('"')) ||
              (tagVal.startsWith("'") && tagVal.endsWith("'"))
            ) {
              tagVal = tagVal.slice(1, -1);
            }
            if (KNOWN_TAGS.has(tagName)) {
              tokens.push({
                type: "open",
                tag: tagName,
                value: tagVal,
                raw: content.slice(i, closeIdx + 1),
              });
              i = closeIdx + 1;
              continue;
            }
          }

          // 4. Simple opening tag [tag]
          const tagName = trimmed.toLowerCase();
          if (KNOWN_TAGS.has(tagName)) {
            tokens.push({
              type: "open",
              tag: tagName,
              raw: content.slice(i, closeIdx + 1),
            });
            i = closeIdx + 1;
            continue;
          }
        }
      }
    }

    // Accumulate regular text until next '[' or '\n'
    let nextSpecial = i + 1;
    while (
      nextSpecial < len &&
      content[nextSpecial] !== "[" &&
      content[nextSpecial] !== "\n"
    ) {
      nextSpecial++;
    }

    tokens.push({
      type: "text",
      raw: content.slice(i, nextSpecial),
    });
    i = nextSpecial;
  }

  return tokens;
}

export type BBCodeNode =
  | { type: "text"; text: string }
  | { type: "newline" }
  | { type: "b" | "i" | "u" | "s" | "spoiler"; children: BBCodeNode[] }
  | { type: "quote"; author?: string; children: BBCodeNode[] }
  | { type: "url"; href: string; children: BBCodeNode[] }
  | { type: "img"; src: string }
  | { type: "code"; text: string }
  | { type: "gallery"; imageIds: string[] };

/**
 * Stack-based AST parser with bounded nesting depth.
 * Guarantees recursion depth is capped at MAX_BBCODE_DEPTH.
 */
function parseTokens(tokens: Token[]): BBCodeNode[] {
  const root: { children: BBCodeNode[] } = { children: [] };
  const stack: {
    tag: string;
    value?: string;
    node: { children: BBCodeNode[] };
  }[] = [{ tag: "root", node: root }];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "newline") {
      stack[stack.length - 1].node.children.push({ type: "newline" });
      i++;
      continue;
    }

    if (token.type === "text") {
      stack[stack.length - 1].node.children.push({
        type: "text",
        text: token.raw,
      });
      i++;
      continue;
    }

    if (token.type === "self-closing" && token.tag === "gallery") {
      const imageIds = (token.value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      stack[stack.length - 1].node.children.push({
        type: "gallery",
        imageIds,
      });
      i++;
      continue;
    }

    if (token.type === "open") {
      const tag = token.tag!;

      // Special handling for [img]: leaf block consuming until [/img]
      if (tag === "img") {
        let textContent = "";
        let foundClose = false;
        let j = i + 1;
        while (j < tokens.length) {
          if (tokens[j].type === "close" && tokens[j].tag === "img") {
            foundClose = true;
            break;
          }
          textContent += tokens[j].raw;
          j++;
        }

        if (foundClose) {
          stack[stack.length - 1].node.children.push({
            type: "img",
            src: textContent.trim(),
          });
          i = j + 1;
          continue;
        } else {
          // No closing [/img], treat opening tag as text
          stack[stack.length - 1].node.children.push({
            type: "text",
            text: token.raw,
          });
          i++;
          continue;
        }
      }

      // Special handling for [code]: leaf block consuming until [/code]
      if (tag === "code") {
        let textContent = "";
        let foundClose = false;
        let j = i + 1;
        while (j < tokens.length) {
          if (tokens[j].type === "close" && tokens[j].tag === "code") {
            foundClose = true;
            break;
          }
          textContent += tokens[j].raw;
          j++;
        }

        if (foundClose) {
          stack[stack.length - 1].node.children.push({
            type: "code",
            text: textContent,
          });
          i = j + 1;
          continue;
        } else {
          stack[stack.length - 1].node.children.push({
            type: "text",
            text: token.raw,
          });
          i++;
          continue;
        }
      }

      // Check max depth
      if (stack.length - 1 >= MAX_BBCODE_DEPTH) {
        // Exceeded max depth: render raw tag without opening deeper nesting
        stack[stack.length - 1].node.children.push({
          type: "text",
          text: token.raw,
        });
        i++;
        continue;
      }

      // Container tags: b, i, u, s, quote, spoiler, url
      let newNode: BBCodeNode;
      if (tag === "quote") {
        newNode = { type: "quote", author: token.value, children: [] };
      } else if (tag === "url") {
        newNode = { type: "url", href: token.value || "", children: [] };
      } else if (
        tag === "b" ||
        tag === "i" ||
        tag === "u" ||
        tag === "s" ||
        tag === "spoiler"
      ) {
        newNode = { type: tag, children: [] };
      } else {
        stack[stack.length - 1].node.children.push({
          type: "text",
          text: token.raw,
        });
        i++;
        continue;
      }

      stack[stack.length - 1].node.children.push(newNode);
      stack.push({ tag, value: token.value, node: newNode });
      i++;
      continue;
    }

    if (token.type === "close") {
      const tag = token.tag!;
      // Find matching tag in stack from top down (ignoring root)
      let matchIdx = -1;
      for (let s = stack.length - 1; s >= 1; s--) {
        if (stack[s].tag === tag) {
          matchIdx = s;
          break;
        }
      }

      if (matchIdx !== -1) {
        // Pop stack back to matchIdx
        stack.length = matchIdx;
      } else {
        // Orphaned close tag: treat as text
        stack[stack.length - 1].node.children.push({
          type: "text",
          text: token.raw,
        });
      }
      i++;
      continue;
    }

    i++;
  }

  // Post-process [url] without explicit attribute value: [url]https://example.com[/url]
  function postProcess(nodes: BBCodeNode[]): BBCodeNode[] {
    return nodes.map((node) => {
      if (node.type === "url" && !node.href) {
        const text = node.children
          .filter((c): c is { type: "text"; text: string } => c.type === "text")
          .map((c) => c.text)
          .join("");
        return { ...node, href: text.trim() };
      }
      if ("children" in node && Array.isArray(node.children)) {
        return { ...node, children: postProcess(node.children) };
      }
      return node;
    });
  }

  return postProcess(root.children);
}

/**
 * Parses inline markdown (**bold**, *italic*) linearly without regular expression backtracking.
 */
function renderInlineText(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    if (text[i] === "*" && i + 1 < len && text[i + 1] === "*") {
      const closeIdx = text.indexOf("**", i + 2);
      if (closeIdx !== -1 && closeIdx - (i + 2) <= 1000) {
        const inner = text.slice(i + 2, closeIdx);
        if (inner.length > 0) {
          elements.push(
            <strong key={`b-${i}`} className="font-bold">
              {inner}
            </strong>
          );
          i = closeIdx + 2;
          continue;
        }
      }
    } else if (text[i] === "*") {
      const closeIdx = text.indexOf("*", i + 1);
      if (closeIdx !== -1 && closeIdx - (i + 1) <= 1000) {
        const inner = text.slice(i + 1, closeIdx);
        if (inner.length > 0 && !inner.includes("\n")) {
          elements.push(
            <em key={`i-${i}`} className="italic">
              {inner}
            </em>
          );
          i = closeIdx + 1;
          continue;
        }
      }
    }

    let nextStar = text.indexOf("*", i);
    if (nextStar === -1) {
      elements.push(text.slice(i));
      break;
    } else if (nextStar === i) {
      elements.push(text[i]);
      i++;
    } else {
      elements.push(text.slice(i, nextStar));
      i = nextStar;
    }
  }

  return elements;
}

export function SpoilerBlock({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`cursor-pointer rounded px-1.5 py-0.5 transition-all duration-200 select-none ${
        revealed
          ? "bg-muted/80 text-foreground"
          : "bg-muted-foreground/30 text-transparent hover:bg-muted-foreground/40"
      }`}
      title={revealed ? "Click to hide spoiler" : "Click to reveal spoiler"}
    >
      {children}
    </span>
  );
}

function renderNode(
  node: BBCodeNode,
  index: number,
  attachments: any[] = []
): React.ReactNode {
  switch (node.type) {
    case "text":
      return <React.Fragment key={index}>{renderInlineText(node.text)}</React.Fragment>;

    case "newline":
      return <br key={index} />;

    case "b":
      return (
        <strong key={index} className="font-bold">
          {node.children.map((child, i) => renderNode(child, i, attachments))}
        </strong>
      );

    case "i":
      return (
        <em key={index} className="italic">
          {node.children.map((child, i) => renderNode(child, i, attachments))}
        </em>
      );

    case "u":
      return (
        <span key={index} className="underline">
          {node.children.map((child, i) => renderNode(child, i, attachments))}
        </span>
      );

    case "s":
      return (
        <del key={index}>
          {node.children.map((child, i) => renderNode(child, i, attachments))}
        </del>
      );

    case "spoiler":
      return (
        <SpoilerBlock key={index}>
          {node.children.map((child, i) => renderNode(child, i, attachments))}
        </SpoilerBlock>
      );

    case "quote":
      return (
        <blockquote
          key={index}
          className="my-3 border-l-4 border-primary/50 bg-muted/50 p-3 rounded-r-md text-muted-foreground italic text-sm"
        >
          {node.author && (
            <div className="font-semibold text-xs not-italic text-foreground mb-1">
              {node.author} said:
            </div>
          )}
          <div className="not-italic text-foreground/90">
            {node.children.map((child, i) => renderNode(child, i, attachments))}
          </div>
        </blockquote>
      );

    case "url": {
      const safeHref = sanitizeUrl(node.href);
      if (safeHref) {
        return (
          <a
            key={index}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {node.children.length > 0
              ? node.children.map((child, i) => renderNode(child, i, attachments))
              : safeHref}
          </a>
        );
      }
      return (
        <React.Fragment key={index}>
          {node.children.map((child, i) => renderNode(child, i, attachments))}
        </React.Fragment>
      );
    }

    case "img": {
      const safeSrc = sanitizeImageUrl(node.src);
      if (!safeSrc) return null;
      return (
        <div
          key={index}
          className="my-4 relative rounded-xl overflow-hidden border border-border/50 max-w-full inline-block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeSrc}
            alt="User uploaded content"
            className="max-w-full max-h-[600px] object-contain"
            loading="lazy"
          />
        </div>
      );
    }

    case "code":
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary"
        >
          {node.text}
        </code>
      );

    case "gallery": {
      const ids = node.imageIds;
      let matched = attachments;
      if (ids.length > 0) {
        matched = ids
          .map((id) => attachments.find((a) => a.imageId === id))
          .filter(Boolean);
      }
      if (matched.length === 0 && attachments.length > 0 && ids.length === 0) {
        matched = attachments;
      }
      if (matched.length === 0) return null;
      return <ResponsiveGallery key={index} attachments={matched} />;
    }

    default:
      return null;
  }
}

export function BBCodeParser({
  content,
  attachments = [],
  className,
  depth: _depth,
}: {
  content: string;
  attachments?: any[];
  className?: string;
  depth?: number;
}) {
  if (!content) return null;

  const tokens = tokenizeBBCode(content);
  const ast = parseTokens(tokens);

  return (
    <div className={className || "space-y-2 text-sm leading-relaxed text-foreground"}>
      {ast.map((node, index) => renderNode(node, index, attachments))}
    </div>
  );
}
