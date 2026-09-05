"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

export function ResponsiveGallery({ attachments }: { attachments: any[] }) {
  if (!attachments || attachments.length === 0) return null;

  const count = attachments.length;

  // Single Image
  if (count === 1) {
    const a = attachments[0];
    return (
      <div className="relative w-full overflow-hidden rounded-xl bg-muted border border-border/50 my-4 group cursor-pointer aspect-video sm:aspect-auto sm:max-h-[600px] flex items-center justify-center">
        <Image
          src={a.thumbUrl || a.imageUrl}
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
          <div
            key={a.id || a.imageId}
            className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-border/50 group cursor-pointer"
          >
            <Image
              src={a.thumbUrl || a.imageUrl}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
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
          <Image
            src={attachments[0].thumbUrl || attachments[0].imageUrl}
            alt=""
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        </div>
        <div className="grid grid-rows-2 gap-2 h-full">
          {attachments.slice(1).map((a) => (
            <div
              key={a.id || a.imageId}
              className="relative h-full overflow-hidden rounded-xl bg-muted border border-border/50 group cursor-pointer"
            >
              <Image
                src={a.thumbUrl || a.imageUrl}
                alt=""
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
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
          <div
            key={a.id || a.imageId}
            className={cn(
              "relative aspect-square overflow-hidden rounded-xl bg-muted border border-border/50 group cursor-pointer",
              i === 0 && count === 4 ? "col-span-2 row-span-2 aspect-auto" : ""
            )}
          >
            <Image
              src={a.thumbUrl || a.imageUrl}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
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
