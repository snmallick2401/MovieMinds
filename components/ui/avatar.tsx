"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type AvatarProps = { name: string; src?: string | null; className?: string };

export function Avatar({ name, src, className }: AvatarProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Sync state if src prop changes
  if (src !== currentSrc) {
    setCurrentSrc(src);
    setHasError(false);
  }

  const showFallback = !src || hasError;

  return (
    <div
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold text-primary select-none",
        className,
      )}
    >
      {!showFallback && src ? (
        <Image
          src={src}
          alt={`${name}'s avatar`}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized
          onError={() => setHasError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </div>
  );
}
