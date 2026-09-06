"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
// Imports removed to avoid lint errors as they are rendered in page.tsx

type ProfileWithFavorites = Prisma.UserGetPayload<{
  include: {
    favorites: {
      include: {
        media: { select: { id: true, title: true, posterUrl: true, year: true, mediaType: true } }
      }
    }
  }
}>;

export function ProfileTabs({
  profile,
  initialTab,
  stats,
  isCurrentUser = false,
}: {
  profile: ProfileWithFavorites;
  initialTab: string;
  stats: unknown;
  isCurrentUser?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || initialTab;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "reviews", label: "Reviews", hidden: !(profile.showReviews || isCurrentUser) },
    { id: "ratings", label: "Ratings", hidden: !(profile.showRatings || isCurrentUser) },
    { id: "library", label: "Library", hidden: !(profile.libraryPublic || isCurrentUser) },
    { id: "stats", label: "Stats", hidden: !(profile.showStats || isCurrentUser) },
  ].filter((t) => !t.hidden);

  return (
    <div className="space-y-8">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`${pathname}?tab=${tab.id}`}
                className={cn(
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
