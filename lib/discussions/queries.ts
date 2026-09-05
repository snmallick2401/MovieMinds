import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type ThreadSort = "newest" | "oldest" | "reactions" | "replies" | "views";

export interface ThreadFilters {
  mediaId?: string;
  userId?: string;
  sort?: ThreadSort;
  page?: number;
  pageSize?: number;
  query?: string;
}

export async function getDiscussionThreads(filters: ThreadFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const where: Prisma.DiscussionThreadWhereInput = {};
  
  if (filters.mediaId) where.mediaId = filters.mediaId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.query) {
    where.title = { contains: filters.query, mode: "insensitive" };
  }

  const orderBy: Prisma.DiscussionThreadOrderByWithRelationInput[] = [];
  if (filters.sort === "oldest") orderBy.push({ createdAt: "asc" });
  else if (filters.sort === "reactions") orderBy.push({ reactionCount: "desc" });
  else if (filters.sort === "replies") orderBy.push({ replyCount: "desc" });
  else if (filters.sort === "views") orderBy.push({ viewCount: "desc" });
  else orderBy.push({ createdAt: "desc" }); // newest is default

  const [threads, total] = await Promise.all([
    prisma.discussionThread.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputationScore: true } },
      }
    }),
    prisma.discussionThread.count({ where }),
  ]);

  return {
    items: threads,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getThreadById(threadId: string) {
  return prisma.discussionThread.findUnique({
    where: { id: threadId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputationScore: true } },
      media: { select: { id: true, title: true, posterUrl: true, mediaType: true } },
      reactions: true,
    }
  });
}

export async function getThreadPosts(threadId: string, page = 1, pageSize = 20) {
  // We'll fetch posts chronologically (Ascending). 
  // For nested replies (depth), we will fetch all matching posts for this thread
  // and construct the tree on the client or server. Since forums flatten past depth 3,
  // we'll fetch them flat here.
  const posts = await prisma.discussionPost.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputationScore: true, createdAt: true, _count: { select: { discussionPosts: true, reviews: true } } } },
      attachments: { orderBy: { sortOrder: "asc" } },
      reactions: true, // We might need to group these by type
    }
  });

  const total = await prisma.discussionPost.count({ where: { threadId } });

  return {
    items: posts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
