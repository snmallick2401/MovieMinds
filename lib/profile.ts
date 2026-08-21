import { Prisma } from "@prisma/client";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const getCachedUser = unstable_cache(
  async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  },
  ["user-profile-cache"],
  { tags: ["user-profile"], revalidate: 3600 * 24 }
);

function buildFallbackUsername(email: string, id: string) {
  const localPart = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const base = localPart?.length ? localPart : `user_${id.slice(0, 8)}`;
  return base.slice(0, 30);
}

export const getOrCreateProfile = cache(async (user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) => {
  const email = user.email?.trim() ?? "user@movieminds.dev";
  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string" && metadata.display_name.trim().length > 0
      ? metadata.display_name.trim()
      : email.split("@")[0] ?? "MovieMinds user";
  const username =
    typeof metadata.username === "string" && metadata.username.trim().length > 0
      ? metadata.username.trim().toLowerCase()
      : buildFallbackUsername(email, user.id);

  try {
    const existing = await getCachedUser(user.id);
    return existing;
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND") {
      try {
        return await prisma.user.create({
          data: {
            id: user.id,
            email,
            username,
            displayName,
          },
        });
      } catch (createErr) {
        // Fallback below
      }
    }

    return {
      id: user.id,
      email,
      username,
      displayName,
      avatarUrl: null,
      bio: null,
      libraryPublic: true,
      bannerUrl: null,
      accentColor: null,
      favoriteGenres: [],
      favoriteCreators: [],
      favoriteServices: [],
      showRatings: true,
      showReviews: true,
      showStats: true,
      showActivity: true,
      showFavorites: true,
      hideAdult: true,
      reputationScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }
});
