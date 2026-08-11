"use client";

import { X } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Profile } from "@/types/profile";

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md animate-in fade-in-0">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-xl font-bold tracking-tight">Edit profile settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Update your public profile, username, bio, and library visibility settings.
        </p>

        <div className="mt-6">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
