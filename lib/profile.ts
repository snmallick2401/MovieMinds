import { Prisma } from "@prisma/client";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const getCachedUser = unstable_cache(
  async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  },
  ["user-profile-cache"],
  { tags: ["user-profile"], revalidate: 3600 * 24 }
);

function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
}

function buildFallbackUsername(email: string, id: string): string {
  const localPart = email.split("@")[0] ?? "";
  const sanitized = sanitizeUsername(localPart);
  const base =
    sanitized.length >= 3 ? sanitized : `user_${id.replace(/[^a-z0-9]/gi, "").slice(0, 8)}`;
  return base.slice(0, 24);
}

export const getOrCreateProfile = cache(
  async (user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  }) => {
    // 1. First, check cache
    try {
      const existing = await getCachedUser(user.id);
      if (existing) return existing;
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== "USER_NOT_FOUND") {
        console.warn("getCachedUser encountered an unexpected error, falling back to direct DB lookup:", err.message);
      }
    }

    // 2. Direct database lookup by id (in case cache is stale or negative)
    const dbUserById = await prisma.user.findUnique({ where: { id: user.id } }).catch(() => null);
    if (dbUserById) {
      return dbUserById;
    }

    const rawEmail = user.email?.trim();
    const email = rawEmail && rawEmail.length > 0 ? rawEmail : `${user.id}@movieminds.dev`;

    // 3. Direct database lookup by email (in case account was pre-created under same email)
    if (rawEmail) {
      const dbUserByEmail = await prisma.user.findUnique({ where: { email } }).catch(() => null);
      if (dbUserByEmail) {
        return dbUserByEmail;
      }
    }

    // 4. Prepare display name & base username
    const metadata = user.user_metadata ?? {};
    const displayNameRaw =
      typeof metadata.display_name === "string" && metadata.display_name.trim().length > 0
        ? metadata.display_name.trim()
        : email.split("@")[0] ?? "MovieMinds User";
    const displayName = displayNameRaw.slice(0, 50);

    const rawUsername = typeof metadata.username === "string" ? metadata.username.trim() : "";
    const sanitizedMetaUsername = sanitizeUsername(rawUsername);
    const baseUsername =
      sanitizedMetaUsername.length >= 3
        ? sanitizedMetaUsername
        : buildFallbackUsername(email, user.id);

    // 5. Attempt creation with retry on collision / race conditions
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateUsername =
        attempt === 0
          ? baseUsername
          : `${baseUsername.slice(0, 22)}_${crypto.randomBytes(3).toString("hex")}`.slice(0, 30);

      try {
        const created = await prisma.user.create({
          data: {
            id: user.id,
            email,
            username: candidateUsername,
            displayName,
          },
        });

        // User successfully created in PostgreSQL: invalidate profile cache
        revalidateTag("user-profile");
        return created;
      } catch (createErr: unknown) {
        if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
          const target = Array.isArray(createErr.meta?.target)
            ? createErr.meta.target.join(",")
            : String(createErr.meta?.target ?? "");

          // Race condition: another concurrent request created the user with user.id
          if (target.includes("id") || target.includes("pkey")) {
            const existing = await prisma.user.findUnique({ where: { id: user.id } });
            if (existing) return existing;
          }

          // Email conflict: existing user with same email
          if (target.includes("email")) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return existing;
          }

          // Username conflict: loop will retry with randomized suffix
          if (target.includes("username")) {
            continue;
          }

          // Fallback check if user was created despite generic P2002 target
          const existing = await prisma.user.findUnique({ where: { id: user.id } });
          if (existing) return existing;
        }

        // If it's the last attempt, or not a unique constraint collision
        if (attempt === maxAttempts - 1) {
          console.error("Failed to create user profile after multiple attempts:", createErr);
          throw createErr;
        }
      }
    }

    // Final check if user was created concurrently
    const finalCheck = await prisma.user.findUnique({ where: { id: user.id } });
    if (finalCheck) return finalCheck;

    throw new Error(`Failed to create user profile for user ID: ${user.id}`);
  }
);
