"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ThreadCategory } from "@prisma/client";
import { requireUser } from "@/lib/auth/server";

export async function createThread(formData: FormData) {
  const user = await requireUser();

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const categoryStr = formData.get("category") as string;
  const mediaId = formData.get("mediaId") as string | null;

  if (!title || !body) throw new Error("Title and body are required");

  let category: ThreadCategory = ThreadCategory.GENERAL;
  if (Object.values(ThreadCategory).includes(categoryStr as ThreadCategory)) {
    category = categoryStr as ThreadCategory;
  }

  const thread = await prisma.discussionThread.create({
    data: {
      userId: user.id,
      title,
      body,
      category,
      mediaId: mediaId || null,
    },
  });

  revalidatePath("/community");
  if (mediaId) {
    revalidatePath(`/media/${mediaId}`);
  }

  return thread.id;
}

export async function replyToThread(threadId: string, body: string, attachmentUrls: string[] = []) {
  const user = await requireUser();

  const post = await prisma.discussionPost.create({
    data: {
      threadId,
      userId: user.id,
      body,
      attachments: {
        create: attachmentUrls.map((url, index) => ({
          imageId: `uploaded-${Date.now()}-${index}`,
          pageUrl: url,
          imageUrl: url,
          thumbUrl: url,
          sortOrder: index,
        })),
      },
    },
  });

  await prisma.discussionThread.update({
    where: { id: threadId },
    data: { replyCount: { increment: 1 }, updatedAt: new Date() },
  });

  revalidatePath(`/community/thread/${threadId}`);
  return post;
}
