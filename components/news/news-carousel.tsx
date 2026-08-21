import { NewsCard } from "./news-card";
import type { NewsArticle } from "@prisma/client";

export function NewsCarousel({ articles }: { articles: NewsArticle[] }) {
  if (!articles.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory hide-scrollbar">
      {articles.map((article) => (
        <div key={article.id} className="w-[280px] min-w-[280px] sm:w-[320px] sm:min-w-[320px] snap-start">
          <NewsCard article={article} />
        </div>
      ))}
    </div>
  );
}
