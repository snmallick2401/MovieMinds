"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Mail, Pencil, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn, formatJoinDate } from "@/lib/utils";
import type { Profile } from "@/types/profile";

export function ProfileHeader({
  profile,
  email,
  onEditClick,
}: {
  profile: Profile;
  email: string;
  onEditClick: () => void;
}) {
  const bioText = profile.bio?.trim() || "Watching stories, collecting memories.";
  const tags = ["Movie Lover", "Anime Fan", "Drama Addict"];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
      {/* Synthwave / Sunset Banner Background */}
      <div className="relative h-44 w-full bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 sm:h-52">
        {/* Sun & Grid graphic */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-600/30 via-purple-600/10 to-transparent" />
        <div className="absolute bottom-0 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-gradient-to-t from-pink-500/40 to-purple-500/0 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Profile Info Overlay */}
      <div className="relative px-6 pb-6 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {/* Avatar & Main Info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative -mt-16 sm:-mt-20">
              <Avatar
                name={profile.displayName}
                src={profile.avatarUrl}
                className="size-28 border-4 border-card text-3xl shadow-2xl sm:size-36 sm:text-4xl"
              />
              <button
                type="button"
                onClick={onEditClick}
                aria-label="Edit avatar"
                className="absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-lg backdrop-blur hover:bg-muted"
              >
                <Pencil className="size-4" />
              </button>
            </div>

            <div className="space-y-1 sm:mb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {profile.displayName}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditClick}
                  className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold"
                >
                  <Pencil className="size-3.5" />
                  Edit profile
                </Button>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                @{profile.username}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {email}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Joined {formatJoinDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Public Profile Link */}
          <div className="sm:mb-2">
            <Link
              href={`/user/${profile.username}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-2 rounded-xl border-border/80 bg-background/50 px-4 text-xs font-semibold backdrop-blur",
              )}
            >
              View public profile
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Bio Quote */}
        <p className="mt-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
          &ldquo;{bioText}&rdquo;
        </p>

        {/* Tag Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300"
            >
              {tag}
            </span>
          ))}
          <button
            type="button"
            onClick={onEditClick}
            className="flex size-7 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground"
            aria-label="Add tag"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
