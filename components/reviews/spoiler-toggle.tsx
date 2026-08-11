"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SpoilerToggle({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className={revealed ? "" : "select-none blur-md"} aria-hidden={!revealed}>
        {children}
      </div>
      {!revealed && (
        <div className="absolute inset-0 grid place-items-center bg-card/55 backdrop-blur-[2px]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRevealed(true)}
          >
            <Eye className="size-4" />
            Reveal spoiler
          </Button>
        </div>
      )}
      {revealed && (
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <EyeOff className="size-3" />
          Hide spoiler
        </button>
      )}
    </div>
  );
}
