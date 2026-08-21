import { NewsCard } from "./news-card";
import type { NewsArticle } from "@prisma/client";

export function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  if (!articles.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
        <p className="text-lg font-medium text-foreground">No news available</p>
        <p className="mt-1 text-sm">Check back later for the latest updates.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
