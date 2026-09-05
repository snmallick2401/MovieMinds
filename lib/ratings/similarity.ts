import { prisma } from "@/lib/prisma";

export async function calculateTasteMatch(userId: string, mediaId: string): Promise<number | null> {
  // 1. Get all users who liked this movie (rating >= 3.5 or library favorite/completed)
  const usersWhoLikedThis = await prisma.userRating.findMany({
    where: {
      mediaId,
      rating: { gte: 3.5 },
      user: { showRatings: true, libraryPublic: true },
    },
    select: { userId: true },
    take: 50,
  });

  if (usersWhoLikedThis.length === 0) return null; // Not enough data
  const otherUserIds = usersWhoLikedThis.map((r) => r.userId).filter(id => id !== userId);
  if (otherUserIds.length === 0) return null;

  // 2. Get current user's positive ratings (rating >= 3.5)
  const currentUserLikes = await prisma.userRating.findMany({
    where: { userId, rating: { gte: 3.5 } },
    select: { mediaId: true },
  });
  
  const currentUserLikedMediaIds = new Set(currentUserLikes.map((l) => l.mediaId));
  if (currentUserLikedMediaIds.size === 0) return null; // New user with no taste profile

  // 3. Find intersection: how many of the current user's liked movies are also liked by the other users?
  // We'll calculate a score based on how many overlap.
  const otherUsersLikes = await prisma.userRating.findMany({
    where: { 
      userId: { in: otherUserIds },
      mediaId: { in: Array.from(currentUserLikedMediaIds) },
      rating: { gte: 3.5 },
      user: { showRatings: true, libraryPublic: true },
    },
    select: { userId: true, mediaId: true }
  });

  let totalMatches = 0;
  for (const like of otherUsersLikes) {
    if (currentUserLikedMediaIds.has(like.mediaId)) {
      totalMatches++;
    }
  }

  // Calculate percentage:
  // Max possible matches = (currentUserLikedMediaIds.size * otherUserIds.length)
  const maxPossible = currentUserLikedMediaIds.size * otherUserIds.length;
  if (maxPossible === 0) return null;

  // We map the raw overlap ratio into a more forgiving "match percentage" curve.
  const rawRatio = totalMatches / maxPossible;
  
  // Example curve: 
  // 0% overlap -> 0% match
  // 5% overlap -> 50% match
  // 10% overlap -> 80% match
  // 20%+ overlap -> 95%+ match
  const matchPercentage = Math.min(Math.round((rawRatio * 10) * 100), 99);
  
  // Ensure a minimum floor if there was at least one match
  return totalMatches > 0 ? Math.max(matchPercentage, 15) : null;
}
