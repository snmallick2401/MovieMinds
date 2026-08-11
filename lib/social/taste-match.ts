import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { MediaSummary } from "@/types/media";
import { serializeMediaSummary } from "@/lib/media/serializers";

export type TasteMatchResult = {
  score: number; // 0-100
  sharedFavorites: MediaSummary[];
  commonGenres: string[];
};

export async function calculateTasteMatch(userId1: string, userId2: string): Promise<TasteMatchResult> {
  if (userId1 === userId2) {
    return { score: 100, sharedFavorites: [], commonGenres: [] };
  }

  // Sort IDs to ensure stable cache key regardless of argument order
  const [uA, uB] = [userId1, userId2].sort();

  const computeMatch = async (idA: string, idB: string) => {
    // 1. Fetch libraries
    const [libA, libB] = await Promise.all([
      prisma.userLibrary.findMany({
        where: { userId: idA, status: "COMPLETED" },
        include: { media: { include: { genres: { include: { genre: true } } } } },
      }),
      prisma.userLibrary.findMany({
        where: { userId: idB, status: "COMPLETED" },
        include: { media: { include: { genres: { include: { genre: true } } } } },
      }),
    ]);

    // 2. Calculate Shared titles
    const titlesA = new Set(libA.map((entry) => entry.mediaId));
    const sharedMedia = libB
      .filter((entry) => titlesA.has(entry.mediaId))
      .map((entry) => entry.media);

    // 3. Fetch Ratings for shared titles
    const [ratingsA, ratingsB] = await Promise.all([
      prisma.userRating.findMany({ where: { userId: idA, mediaId: { in: sharedMedia.map(m => m.id) } } }),
      prisma.userRating.findMany({ where: { userId: idB, mediaId: { in: sharedMedia.map(m => m.id) } } }),
    ]);
    const ratingMapA = new Map(ratingsA.map((r) => [r.mediaId, Number(r.rating)]));
    const ratingMapB = new Map(ratingsB.map((r) => [r.mediaId, Number(r.rating)]));

    let ratingDiffSum = 0;
    let ratedSharedCount = 0;
    for (const media of sharedMedia) {
      if (ratingMapA.has(media.id) && ratingMapB.has(media.id)) {
        const diff = Math.abs(ratingMapA.get(media.id)! - ratingMapB.get(media.id)!);
        ratingDiffSum += diff;
        ratedSharedCount++;
      }
    }

    // 4. Calculate Genre Overlap
    const genresA = libA.flatMap((entry) => entry.media.genres.map(g => g.genre.name));
    const genresB = libB.flatMap((entry) => entry.media.genres.map(g => g.genre.name));
    
    const countGenres = (arr: string[]) => {
      const counts: Record<string, number> = {};
      for (const g of arr) counts[g] = (counts[g] || 0) + 1;
      return counts;
    };
    
    const countsA = countGenres(genresA);
    const countsB = countGenres(genresB);
    
    const topA = Object.entries(countsA).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
    const topB = Object.entries(countsB).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
    const commonGenres = topA.filter(g => topB.includes(g));

    // 5. Score Algorithm
    const minLibSize = Math.min(libA.length, libB.length) || 1;
    const sharedRatio = sharedMedia.length / minLibSize;
    const libraryScore = Math.min(40, sharedRatio * 80); // 50% overlap gives max 40 points
    
    const genreScore = (commonGenres.length / 5) * 30; // max 30 points

    let ratingScore = 30;
    if (ratedSharedCount > 0) {
      const avgDiff = ratingDiffSum / ratedSharedCount;
      ratingScore = Math.max(0, 30 - (avgDiff * 6)); // Deduct points for larger rating differences
    }

    const rawScore = Math.round(libraryScore + genreScore + ratingScore);
    const finalScore = sharedMedia.length === 0 ? Math.round(genreScore / 2) : Math.max(10, Math.min(100, rawScore));

    // 6. Find Shared Favorites
    const [favA, favB] = await Promise.all([
      prisma.userFavorite.findMany({ where: { userId: idA } }),
      prisma.userFavorite.findMany({ where: { userId: idB } }),
    ]);
    const favIdsA = new Set(favA.map((f) => f.mediaId));
    const sharedFavMediaIds = favB.filter((f) => favIdsA.has(f.mediaId)).map((f) => f.mediaId);
    
    let topSharedIds = sharedFavMediaIds;
    if (topSharedIds.length === 0 && sharedMedia.length > 0) {
      // Fallback to highest rated shared media
      const sortedShared = [...sharedMedia].sort((a, b) => {
        const rA1 = ratingMapA.get(a.id) || 0;
        const rA2 = ratingMapB.get(a.id) || 0;
        const rB1 = ratingMapA.get(b.id) || 0;
        const rB2 = ratingMapB.get(b.id) || 0;
        return (rB1 + rB2) - (rA1 + rA2);
      });
      topSharedIds = sortedShared.slice(0, 4).map(m => m.id);
    }

    const topSharedFull = await prisma.media.findMany({
      where: { id: { in: topSharedIds.slice(0, 4) } },
      include: { genres: { include: { genre: true } } }
    });

    return {
      score: finalScore,
      sharedFavorites: topSharedFull.map((m) => serializeMediaSummary(m as any)),
      commonGenres: commonGenres.slice(0, 3),
    };
  };

  try {
    const cachedGetMatch = unstable_cache(
      computeMatch,
      [`taste-match-${uA}-${uB}`],
      { revalidate: 43200, tags: ["taste-match", `taste-match-${uA}`, `taste-match-${uB}`] } // 12 hours TTL
    );

    return await cachedGetMatch(uA, uB);
  } catch (err: any) {
    if (err?.message?.includes("incrementalCache missing")) {
      return await computeMatch(uA, uB);
    }
    throw err;
  }
}
