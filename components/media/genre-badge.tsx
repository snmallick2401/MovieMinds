import { cn } from "@/lib/utils";

export function GenreBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {name}
    </span>
  );
}
