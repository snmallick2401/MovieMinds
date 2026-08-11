import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function buildFallbackUsername(email: string, id: string) {
  const localPart = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const base = localPart?.length ? localPart : `user_${id.slice(0, 8)}`;
  return base.slice(0, 30);
}

export async function getOrCreateProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  const email = user.email?.trim();
  if (!email) {
    throw new Error("Authenticated user is missing an email address.");
  }

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
    return await prisma.user.create({
      data: {
        id: user.id,
        email,
        username,
        displayName,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const retry = await prisma.user.findUnique({ where: { id: user.id } });
      if (retry) return retry;
    }
    throw error;
  }
}
