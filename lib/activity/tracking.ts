import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type LogActivityParams = Omit<Prisma.ActivityUncheckedCreateInput, "id" | "createdAt">;

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activity.create({
      data: params,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function removeActivity(
  userId: string,
  mediaId: string,
  type: "RATED" | "REVIEWED" | "COMPLETED" | "STARTED" | "WISHLISTED"
) {
  try {
    await prisma.activity.deleteMany({
      where: { userId, mediaId, type },
    });
  } catch (err) {
    console.error("Failed to remove activity:", err);
  }
}
