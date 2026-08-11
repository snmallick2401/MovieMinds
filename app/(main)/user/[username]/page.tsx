import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/library/queries";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { OverviewTab } from "@/components/profile/tabs/overview-tab";
import { StatsTab } from "@/components/profile/tabs/stats-tab";
import { ReviewsTab } from "@/components/profile/tabs/reviews-tab";
import { RatingsTab } from "@/components/profile/tabs/ratings-tab";
import { LibraryTab } from "@/components/profile/tabs/library-tab";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await prisma.user.findUnique({
    where: { username },
    select: { displayName: true, bio: true, avatarUrl: true, bannerUrl: true },
  });
  if (!profile) return {};
  return {
    title: `${profile.displayName} (@${username})`,
    description: profile.bio || `Check out ${profile.displayName}'s movie and anime profile on MovieMinds.`,
    openGraph: {
      images: profile.bannerUrl ? [profile.bannerUrl] : [],
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const { username } = await params;
  const { tab = "overview", status } = await searchParams;
  
  const profile = await prisma.user.findUnique({
    where: { username },
    include: {
      favorites: {
        include: {
          media: { select: { id: true, title: true, posterUrl: true, year: true, mediaType: true } }
        },
        orderBy: { position: "asc" }
      }
    }
  });
  
  if (!profile) notFound();
  
  const stats = await getUserStats(profile.id);
  
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 md:-mx-8 md:-mt-8">
      <ProfileHero profile={profile} stats={stats} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileTabs profile={profile} initialTab={tab} stats={stats} />
        <div className="mt-8 min-h-[50vh]">
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
            {tab === "overview" && <OverviewTab profile={profile} stats={stats} />}
            {tab === "stats" && profile.showStats && <StatsTab profile={profile} stats={stats} />}
            {tab === "reviews" && profile.showReviews && <ReviewsTab userId={profile.id} username={profile.username} />}
            {tab === "ratings" && profile.showRatings && <RatingsTab userId={profile.id} username={profile.username} />}
            {tab === "library" && profile.libraryPublic && <LibraryTab userId={profile.id} username={profile.username} filterStatus={status} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
