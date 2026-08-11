"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LibraryEntry } from "@/types/library";

export function LibraryOverviewCard({
  items,
  completionRate,
}: {
  items: LibraryEntry[];
  completionRate: number;
}) {
  const total = items.length;

  const counts = {
    WATCHING: items.filter((i) => i.status === "WATCHING").length,
    COMPLETED: items.filter((i) => i.status === "COMPLETED").length,
    PLAN_TO_WATCH: items.filter((i) => i.status === "PLAN_TO_WATCH").length,
    ON_HOLD: items.filter((i) => i.status === "ON_HOLD").length,
    DROPPED: items.filter((i) => i.status === "DROPPED").length,
  };

  const statuses = [
    { label: "Watching", count: counts.WATCHING, color: "bg-blue-500", stroke: "#3b82f6" },
    { label: "Completed", count: counts.COMPLETED, color: "bg-emerald-500", stroke: "#10b981" },
    { label: "Plan to Watch", count: counts.PLAN_TO_WATCH, color: "bg-purple-500", stroke: "#a855f7" },
    { label: "On Hold", count: counts.ON_HOLD, color: "bg-amber-500", stroke: "#f59e0b" },
    { label: "Dropped", count: counts.DROPPED, color: "bg-rose-500", stroke: "#f43f5e" },
  ];

  // SVG Donut Chart Calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  let accumulatedOffset = 0;

  const chartSegments = statuses.map((s) => {
    const percentage = total > 0 ? s.count / total : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += percentage * circumference;
    return { ...s, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Library Overview</h2>

        {/* Ring Chart & Breakdown Legend */}
        <div className="mt-6 flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Donut Chart Ring */}
          <div className="relative flex size-36 shrink-0 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-muted/40"
                strokeWidth="12"
                fill="none"
              />
              {total > 0 ? (
                chartSegments.map(
                  (segment) =>
                    segment.count > 0 && (
                      <circle
                        key={segment.label}
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={segment.stroke}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={segment.strokeDasharray}
                        strokeDashoffset={segment.strokeDashoffset}
                        strokeLinecap="round"
                      />
                    ),
                )
              ) : (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-purple-500/20"
                  strokeWidth="12"
                  fill="none"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Total titles
              </span>
            </div>
          </div>

          {/* Status Breakdown Legend */}
          <div className="w-full space-y-2.5 sm:max-w-[200px]">
            {statuses.map(({ label, count, color }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${color}`} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{count}</span>
                    <span className="w-8 text-right text-muted-foreground">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Rate Progress Bar */}
        <div className="mt-6 border-t border-border/60 pt-5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Completion rate</span>
            <span>{completionRate}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* View full library Button */}
      <div className="mt-6">
        <Link
          href="/library"
          className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-background/50 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60"
        >
          <span>View full library</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
