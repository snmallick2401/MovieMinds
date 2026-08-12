"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/navigation/nav-items";

// 5 primary items for the bottom navigation bar on mobile
const mobileBottomNavHrefs = ["/", "/explore", "/community", "/notifications", "/profile"];

export function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  const items = mobile
    ? navItems.filter((item) => mobileBottomNavHrefs.includes(item.href))
    : navItems;

  return (
    <nav
      className={cn(mobile ? "grid grid-cols-5 w-full items-center" : "space-y-1")}
      aria-label="Primary navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
              mobile ? "flex-col justify-center gap-1 px-1 py-2 text-[11px] text-center" : "px-3 py-2.5",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className={cn(mobile ? "size-5" : "size-4")} />
            <span className="truncate max-w-full">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
