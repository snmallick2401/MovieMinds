"use client";

import React from "react";
import { ResponsiveGallery } from "./responsive-gallery";
import { BBCodeParser, SpoilerBlock } from "./bbcode-parser";

export { ResponsiveGallery, SpoilerBlock };

export function RichContent({
  content,
  attachments = [],
}: {
  content: string;
  attachments?: any[];
}) {
  return (
    <div className="whitespace-pre-wrap break-words">
      <BBCodeParser content={content} attachments={attachments} />
    </div>
  );
}

