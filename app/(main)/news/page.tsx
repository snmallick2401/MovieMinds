import { getLatestNews } from "@/lib/news/queries";
import { NewsGrid } from "@/components/news/news-grid";
import { Newspaper } from "lucide-react";

export const metadata = {
  title: "Latest Anime News",
  description: "Stay up to date with the latest anime and manga news.",
};

export default async function NewsPage() {
  const articles = await getLatestNews(48);

  return (
    <div className="container max-w-7xl px-4 py-8 md:py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Newspaper className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Latest News</h1>
          <p className="text-muted-foreground">The newest headlines from around the anime community</p>
        </div>
      </div>
      
      <NewsGrid articles={articles} />
    </div>
  );
}
