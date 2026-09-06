import { prisma } from "@/lib/prisma";
import { UserCard } from "./user-card";
import { calculateTasteMatch } from "@/lib/social/taste-match";

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  createdAt: true,
  _count: { select: { reviews: true, library: true } },
};

export async function PeopleList({ category, currentUserId }: { category: "similar" | "popular" | "new", currentUserId?: string }) {
  let usersData: any[] = [];

  if (category === "new") {
    const users = await prisma.user.findMany({
      where: currentUserId ? { id: { not: currentUserId } } : undefined,
      select: publicUserSelect,
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    usersData = users.map(u => ({ user: u }));
  } else if (category === "popular") {
    const users = await prisma.user.findMany({
      where: currentUserId ? { id: { not: currentUserId } } : undefined,
      select: publicUserSelect,
      orderBy: { reviews: { _count: "desc" } },
      take: 6,
    });
    usersData = users.map(u => ({ user: u }));
  } else if (category === "similar" && currentUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { libraryPublic: true },
    });

    if (!currentUser?.libraryPublic) {
      return (
        <p className="text-muted-foreground bg-card border border-border/50 rounded-xl p-8 text-center">
          Your library is set to private. Make your library public in profile settings to discover users with similar taste.
        </p>
      );
    }

    const recentUsers = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        libraryPublic: true,
        library: { some: { status: "COMPLETED" } },
      },
      select: publicUserSelect,
      orderBy: { updatedAt: "desc" },
      take: 12,
    });

    const withMatch = await Promise.all(
      recentUsers.map(async (u) => {
        const match = await calculateTasteMatch(currentUserId, u.id);
        return { user: u, match };
      })
    );

    usersData = withMatch.sort((a, b) => b.match.score - a.match.score).slice(0, 6);
  }

  if (usersData.length === 0) {
    return <p className="text-muted-foreground bg-card border border-border/50 rounded-xl p-8 text-center">No users found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {usersData.map(data => (
        <UserCard key={data.user.id} user={data.user} currentUserId={currentUserId} match={data.match} />
      ))}
    </div>
  );
}
