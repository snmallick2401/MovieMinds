import Link from "next/link";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/search-bar";
import { NavigationLinks } from "@/components/navigation/navigation-links";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Profile } from "@/types/profile";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-card px-4 py-5 md:flex">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 px-2 text-xl font-bold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            M
          </span>
          MovieMinds
        </Link>
        <NavigationLinks />
        <div className="mt-auto space-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={profile.displayName} src={profile.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{profile.username}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <div className="pb-16 md:pb-0 md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Navigation menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden max-w-md flex-1 sm:block">
            <SearchBar />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link href="/profile" aria-label="Open profile">
              <Avatar name={profile.displayName} src={profile.avatarUrl} />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl animate-fade-in px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <NavigationLinks mobile />
      </footer>
    </div>
  );
}
