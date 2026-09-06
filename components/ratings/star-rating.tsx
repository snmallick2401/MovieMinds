"use client";

import { Star } from "lucide-react";
import { useRef, useState } from "react";

export function StarRating({ value, onChange, readOnly = false, size = "md" }: { value: number | null; onChange?: (value: number) => void; readOnly?: boolean; size?: "sm" | "md" | "lg" }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const active = hovered ?? value ?? 0;
  const starSize = size === "lg" ? "size-9" : size === "sm" ? "size-4" : "size-6";
  function select(event: React.MouseEvent<HTMLButtonElement>, index: number) { if (readOnly || !onChange) return; const box = event.currentTarget.getBoundingClientRect(); onChange(index - (event.clientX - box.left < box.width / 2 ? 0.5 : 0)); }
  return <div ref={ref} role={readOnly ? "img" : "radiogroup"} aria-label={value === null ? "Not rated" : `${value.toFixed(1)} out of 7`} className="inline-flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>{Array.from({ length: 7 }, (_, offset) => { const index = offset + 1; const fill = Math.max(0, Math.min(1, active - (index - 1))); return <button key={index} type="button" disabled={readOnly} role="radio" aria-checked={value === index} aria-label={`Rate ${index} out of 7`} onMouseMove={(event) => { if (!readOnly) { const box = event.currentTarget.getBoundingClientRect(); setHovered(index - (event.clientX - box.left < box.width / 2 ? 0.5 : 0)); } }} onClick={(event) => select(event, index)} onKeyDown={(event) => { if (!onChange || readOnly) return; if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); onChange(Math.min(7, (value ?? 0) + 0.5)); } if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); onChange(Math.max(0.5, (value ?? 0.5) - 0.5)); } }} className={`relative grid place-items-center rounded-sm transition-transform duration-200 ease-out ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"} ${fill > 0 && !readOnly ? "scale-110" : ""}`}><Star className={`${starSize} text-amber-400/20 transition-colors`} /><span className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-150 ease-out" style={{ width: `${fill * 100}%` }}><Star className={`${starSize} fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]`} /></span></button>; })}</div>;
}
