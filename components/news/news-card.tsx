import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Newspaper } from "lucide-react";
import type { NewsArticle } from "@prisma/client";

function sanitizeHtmlText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function NewsCard({ article }: { article: NewsArticle }) {
  const cleanTitle = sanitizeHtmlText(article.title);
  const cleanSummary = sanitizeHtmlText(article.summary);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={cleanTitle}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950 p-4">
            <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-purple-500/10 blur-xl" />
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-sm">
                <Newspaper className="size-5" />
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                {article.source}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-bold text-xs text-purple-400">{article.source}</span>
          <time dateTime={new Date(article.publishedAt).toISOString()} className="text-[11px]">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </time>
        </div>
        
        <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug tracking-tight text-foreground group-hover:text-purple-400 transition-colors">
          {cleanTitle}
        </h3>
        
        {cleanSummary && (
          <p className="line-clamp-2 mt-auto text-xs text-muted-foreground leading-relaxed">
            {cleanSummary}
          </p>
        )}
      </div>
    </a>
  );
}
