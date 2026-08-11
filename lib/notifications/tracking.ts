import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  actorId: string;
  type: NotificationType;
  mediaId?: string;
  reviewId?: string;
  metadata?: any;
}) {
  // Never notify oneself
  if (params.userId === params.actorId) return;

  try {
    // Attempt to find an existing unread notification of the same type and context
    const existing = await prisma.notification.findFirst({
      where: {
        userId: params.userId,
        type: params.type,
        read: false,
        mediaId: params.mediaId || null,
        reviewId: params.reviewId || null,
      },
    });

    if (existing) {
      // Parse existing metadata to increment count
      let currentCount = 1;
      let existingMetadata = existing.metadata as any;
      
      if (existingMetadata && typeof existingMetadata === "object" && existingMetadata.count) {
        currentCount = existingMetadata.count;
      }
      
      // Merge with any incoming metadata
      const newMetadata = {
        ...(params.metadata || {}),
        count: currentCount + 1,
      };

      // Update the existing notification: bump to top and update actor/metadata
      return await prisma.notification.update({
        where: { id: existing.id },
        data: {
          actorId: params.actorId, // Last person to perform the action becomes the primary actor
          createdAt: new Date(),   // Bump to top
          metadata: newMetadata,
        },
      });
    }

    // Otherwise, create a new one with count = 1
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        type: params.type,
        mediaId: params.mediaId,
        reviewId: params.reviewId,
        metadata: { ...(params.metadata || {}), count: 1 },
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
