import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { NewsArticle } from "@prisma/client";

export const getLatestNews = unstable_cache(
  async (limit: number = 24) => {
    return prisma.newsArticle.findMany({
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  },
  ["latest-news"],
  { revalidate: 3600, tags: ["news"] }
);

export const getPaginatedNews = unstable_cache(
  async (page: number, limit: number = 24) => {
    const [items, total] = await Promise.all([
      prisma.newsArticle.findMany({
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.newsArticle.count(),
    ]);
    return { items, total, totalPages: Math.ceil(total / limit) };
  },
  ["paginated-news"],
  { revalidate: 3600, tags: ["news"] }
);

export const getNewsForMedia = unstable_cache(
  async (mediaTitle: string, limit: number = 8): Promise<NewsArticle[]> => {
    if (!mediaTitle) return [];
    
    // Use Postgres websearch_to_tsquery for highly accurate contextual tokenized search
    // This cleanly handles punctuation, subtitles, and token stemming without sequential scans
    const results = await prisma.$queryRaw<NewsArticle[]>`
      SELECT id, source, title, url, "imageUrl", summary, "publishedAt", "createdAt"
      FROM news_articles
      WHERE to_tsvector('english', title || ' ' || COALESCE(summary, '')) @@ websearch_to_tsquery('english', ${mediaTitle})
      ORDER BY "publishedAt" DESC
      LIMIT ${limit}
    `;
    
    return results;
  },
  ["news-for-media"],
  { revalidate: 86400, tags: ["news"] }
);
