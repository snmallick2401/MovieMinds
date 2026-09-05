import { prisma } from "@/lib/prisma";
import { ThreadCategory } from "@prisma/client";

export async function getCommunityThreads(
  category?: ThreadCategory,
  page = 1,
  limit = 20
) {
  const where = category ? { category } : {};

  const threads = await prisma.discussionThread.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          reputationScore: true,
        },
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  const total = await prisma.discussionThread.count({ where });

  return { threads, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getThreadDetails(threadId: string, page = 1, limit = 20) {
  const thread = await prisma.discussionThread.findUnique({
    where: { id: threadId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          reputationScore: true,
          createdAt: true,
        },
      },
      reactions: true,
      posts: {
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              reputationScore: true,
              createdAt: true,
            },
          },
          attachments: true,
          reactions: true,
        },
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  return thread;
}
