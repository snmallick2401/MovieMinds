"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MediaTabs({ mediaId }: { mediaId: string }) {
  const pathname = usePathname();
  
  const tabs = [
    { name: "Overview", href: `/media/${mediaId}` },
    { name: "Reviews", href: `/media/${mediaId}/reviews` },
    { name: "Community", href: `/media/${mediaId}/community` },
  ];

  return (
    <div className="mt-8 border-b border-border">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = 
            tab.name === "Overview" 
              ? pathname === tab.href 
              : pathname === tab.href || pathname.startsWith(tab.href + "/");
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
