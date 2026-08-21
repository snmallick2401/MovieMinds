import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@prisma/client";

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">{article.source}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{article.source}</span>
          <time dateTime={new Date(article.publishedAt).toISOString()}>
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </time>
        </div>
        
        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-tight tracking-tight text-foreground group-hover:text-primary">
          {article.title}
        </h3>
        
        {article.summary && (
          <p className="line-clamp-2 mt-auto text-sm text-muted-foreground">
            {article.summary}
          </p>
        )}
      </div>
    </a>
  );
}
