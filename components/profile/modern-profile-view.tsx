"use client";

import { useState } from "react";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { GenreProgressCard } from "@/components/profile/genre-progress-card";
import { LibraryOverviewCard } from "@/components/profile/library-overview-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { QuickActionsBar } from "@/components/profile/quick-actions-bar";
import { RecentActivityCard } from "@/components/profile/recent-activity-card";
import { RecentlyReviewedCard } from "@/components/profile/recently-reviewed-card";
import type { LibraryEntry } from "@/types/library";
import type { Profile } from "@/types/profile";

export function ModernProfileView({
  profile,
  email,
  stats,
  libraryItems,
  recentReviews,
  recentActivity,
}: {
  profile: Profile;
  email: string;
  stats: {
    totalWatched: number;
    hoursWatched: number;
    averageRating: number | null;
    completionRate: number;
    favoriteGenres: Array<{ name: string; count: number }>;
  };
  libraryItems: LibraryEntry[];
  recentReviews: Array<{
    id: string;
    title: string | null;
    body: string;
    spoiler: boolean;
    visibility: "PUBLIC" | "PRIVATE";
    createdAt: Date;
    media: {
      id: string;
      slug: string | null;
      title: string;
      mediaType:
        "MOVIE" | "TV" | "ANIME" | "ANIME_MOVIE" | "OVA" | "DOCUMENTARY" | "SPECIAL";
      year: number | null;
      posterUrl: string | null;
      averageRating: number | null;
    };
  }>;
  recentActivity?: LibraryEntry | null;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const topGenre = stats.favoriteGenres[0]?.name ?? "Drama";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Banner Header */}
      <ProfileHeader
        profile={profile}
        email={email}
        onEditClick={() => setEditModalOpen(true)}
      />

      {/* 5 Metric Cards Bar */}
      <ProfileStats
        totalWatched={stats.totalWatched}
        hoursWatched={stats.hoursWatched}
        averageRating={stats.averageRating}
        topGenre={topGenre}
        streakDays={1}
      />

      {/* 2-Column Main Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left Column: Library Overview */}
        <LibraryOverviewCard items={libraryItems} completionRate={stats.completionRate} />

        {/* Right Column: Recent Activity & Favorite Genres */}
        <div className="space-y-6">
          <RecentActivityCard recentEntry={recentActivity} />
          <GenreProgressCard favoriteGenres={stats.favoriteGenres} />
        </div>
      </div>

      {/* Recently Reviewed Section */}
      <RecentlyReviewedCard reviews={recentReviews} />

      {/* Quick Actions Bar */}
      <QuickActionsBar username={profile.username} />

      {/* Edit Profile Dialog Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
