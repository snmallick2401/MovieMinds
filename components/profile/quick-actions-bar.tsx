import Link from "next/link";
import { BarChart3, ListPlus, Plus, Users, UtensilsCrossed } from "lucide-react";

export function QuickActionsBar({ username }: { username: string }) {
  const actions = [
    { label: "Add to library", href: "/explore", icon: Plus },
    { label: "Write review", href: "/library", icon: UtensilsCrossed },
    { label: "Create list", href: "/library", icon: ListPlus },
    { label: "View stats", href: "/stats", icon: BarChart3 },
    { label: "Find friends", href: `/user/${username}`, icon: Users },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="text-base font-bold tracking-tight">Quick actions</h2>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground backdrop-blur transition-all hover:border-purple-500/40 hover:bg-muted/80 hover:shadow-md"
          >
            <Icon className="size-3.5 text-purple-400" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
