import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { CalendarDays, Star, Library } from "lucide-react";
import type { Prisma } from "@prisma/client";

type ProfileHeroProps = {
  profile: Prisma.UserGetPayload<{ include: { favorites: true } }>;
  stats: {
    totalWatched: number;
    averageRating: number | null;
  };
};

export function ProfileHero({ profile, stats }: ProfileHeroProps) {
  return (
    <section className="relative isolate">
      {/* Banner */}
      <div className="h-48 w-full bg-muted sm:h-64 md:h-80 lg:h-96 relative overflow-hidden">
        {profile.bannerUrl ? (
          <Image
            src={profile.bannerUrl}
            alt={`${profile.displayName}'s banner`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5" 
            style={profile.accentColor ? { backgroundImage: `linear-gradient(to right, ${profile.accentColor}40, ${profile.accentColor}10)` } : undefined}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 flex flex-col items-center gap-6 sm:-mt-24 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="relative rounded-full rounded-2xl p-1.5 bg-background shadow-xl">
              <Avatar
                src={profile.avatarUrl}
                name={profile.displayName}
                className="size-32 rounded-2xl border-2 border-border object-cover sm:size-40 md:size-48"
              />
            </div>
            
            {/* User Info */}
            <div className="text-center sm:pb-4 sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {profile.displayName}
              </h1>
              <div className="mt-2 flex items-center justify-center gap-3 text-muted-foreground sm:justify-start">
                <p className="font-medium text-primary">@{profile.username}</p>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span className="flex items-center gap-1.5 text-sm">
                  <CalendarDays className="size-4" />
                  Joined {new Date(profile.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio & Top Stats */}
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            {profile.bio ? (
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            ) : (
              <p className="italic text-muted-foreground">No bio provided.</p>
            )}
            
            {(profile.favoriteGenres.length > 0 || profile.favoriteCreators.length > 0) && (
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.favoriteGenres.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Genres:</span>
                    <span>{profile.favoriteGenres.join(", ")}</span>
                  </div>
                )}
                {profile.favoriteCreators.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Creators:</span>
                    <span>{profile.favoriteCreators.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 md:flex-col md:justify-start">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Library className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Watched</p>
                <p className="font-bold">{stats.totalWatched}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Star className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="font-bold">{stats.averageRating ? stats.averageRating.toFixed(1) : "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
