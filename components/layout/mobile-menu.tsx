"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavigationLinks } from "@/components/navigation/navigation-links";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SantoryuHamburger } from "@/components/layout/SantoryuHamburger";
import Link from "next/link";
import type { Profile } from "@/types/profile";

export function MobileMenu({ profile }: { profile?: Profile | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuContent = (
    <>
      {/* Drawer & Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-64 max-w-sm flex flex-col bg-card border-r border-border h-full shadow-xl animate-in slide-in-from-left duration-200 z-10 pt-16">
            {/* The header is empty here because the global fixed button covers the top-left, and the logo is placed next to it */}
            <div className="absolute top-0 left-0 w-full h-16 flex items-center px-4 border-b border-border">
              {/* Spacer for the fixed button */}
              <div className="w-[52px] shrink-0" />
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold tracking-tight"
                onClick={() => setIsOpen(false)}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  M
                </span>
                MovieMinds
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" onClick={() => setIsOpen(false)}>
              <NavigationLinks />
            </div>

            <div className="p-4 border-t border-border mt-auto space-y-2 bg-card">
              {profile ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={profile.displayName || profile.username || "User"} src={profile.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{profile.displayName || profile.username}</p>
                      {profile.username && (
                        <p className="truncate text-xs text-muted-foreground">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <SignOutButton />
                </>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" className="block w-full" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" className="block w-full" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Create Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Fixed Button - Always visible, anchors the animation */}
      <div className="fixed top-2 left-2 z-[60] md:hidden">
        <SantoryuHamburger 
          isOpen={isOpen} 
          onToggle={(state) => setIsOpen(state)} 
        />
      </div>
    </>
  );

  return (
    <>
      {/* Spacer in the main header to hold the layout structure for the fixed button */}
      <div className="md:hidden shrink-0 w-[52px] h-[52px] -ml-2 mr-1" />
      {mounted && typeof document !== "undefined" ? createPortal(menuContent, document.body) : null}
    </>
  );
}
