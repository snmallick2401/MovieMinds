"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import {
  discussionThreadCreateSchema,
  discussionReplyCreateSchema,
} from "@/lib/validations/discussions";

export async function createThread(formData: FormData) {
  const user = await requireUser();

  const titleRaw = formData.get("title");
  const bodyRaw = formData.get("body");
  const categoryRaw = formData.get("category");
  const spoilerRaw = formData.get("spoiler");
  const mediaIdRaw = formData.get("mediaId") as string | null;

  const parsed = discussionThreadCreateSchema.safeParse({
    title: typeof titleRaw === "string" ? titleRaw : "",
    body: typeof bodyRaw === "string" ? bodyRaw : "",
    category: typeof categoryRaw === "string" && categoryRaw ? categoryRaw : undefined,
    spoiler: spoilerRaw === "true" || spoilerRaw === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid thread data.");
  }

  const { title, body, category, spoiler } = parsed.data;

  const thread = await prisma.discussionThread.create({
    data: {
      userId: user.id,
      title,
      body,
      category,
      spoiler,
      mediaId: mediaIdRaw || null,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { reputationScore: { increment: 2 } },
  });

  revalidatePath("/community");
  if (mediaIdRaw) {
    revalidatePath(`/media/${mediaIdRaw}`);
  }

  return thread.id;
}

export async function replyToThread(
  threadId: string,
  body: string,
  attachmentUrls: string[] = []
) {
  const user = await requireUser();

  const thread = await prisma.discussionThread.findUnique({
    where: { id: threadId },
    select: { id: true, locked: true },
  });

  if (!thread) throw new Error("Thread not found.");
  if (thread.locked) throw new Error("This thread is locked for replies.");

  const parsed = discussionReplyCreateSchema.safeParse({
    body,
    attachmentUrls,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid reply data.");
  }

  const post = await prisma.discussionPost.create({
    data: {
      threadId,
      userId: user.id,
      body: parsed.data.body,
      attachments: parsed.data.attachmentUrls?.length
        ? {
            create: parsed.data.attachmentUrls.map((url, index) => ({
              imageId: `uploaded-${Date.now()}-${index}`,
              pageUrl: url,
              imageUrl: url,
              thumbUrl: url,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  await prisma.discussionThread.update({
    where: { id: threadId },
    data: { replyCount: { increment: 1 }, updatedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { reputationScore: { increment: 1 } },
  });

  revalidatePath(`/community/thread/${threadId}`);
  return post;
}
