import { ModernProfileView } from "@/components/profile/modern-profile-view";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getLibraryDashboard, getUserStats } from "@/lib/library/queries";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, stats, dashboard, recentReviews] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }).catch(() => null),
    getUserStats(user.id),
    getLibraryDashboard(user.id),
    prisma.review
      .findMany({
        where: { userId: user.id },
        include: {
          media: {
            select: {
              id: true,
              slug: true,
              title: true,
              mediaType: true,
              year: true,
              posterUrl: true,
              averageRating: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      })
      .catch(() => []),
  ]);

  if (!profile) return null;

  const recentActivity = dashboard.items[0] ?? null;

  return (
    <ModernProfileView
      profile={profile}
      email={user.email ?? profile.email}
      stats={stats}
      libraryItems={dashboard.items}
      recentReviews={recentReviews}
      recentActivity={recentActivity}
    />
  );
}
