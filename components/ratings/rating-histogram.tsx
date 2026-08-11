import type { RatingDistributionItem } from "@/types/rating";

export function RatingHistogram({ distribution }: { distribution: RatingDistributionItem[] }) {
  const highest = Math.max(1, ...distribution.map((item) => item.count));
  return <div className="space-y-1.5" aria-label="Community rating distribution">{distribution.map((item) => <div key={item.rating} className="flex items-center gap-2 text-xs"><span className="w-7 text-right font-medium text-amber-400">{item.rating.toFixed(1)}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-[width] duration-500" style={{ width: `${(item.count / highest) * 100}%` }} /></div><span className="w-7 text-muted-foreground">{item.count}</span></div>)}</div>;
}
