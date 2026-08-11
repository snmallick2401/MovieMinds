import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import type { MediaSummary } from "@/types/media";

export function MediaRow({
  title,
  description,
  items,
  href = "/explore",
}: {
  title: string;
  description: string;
  items: MediaSummary[];
  href?: string;
}) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          See all <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {items.map((media, index) => (
          <div key={media.id} className="w-36 shrink-0 snap-start sm:w-40">
            <MediaCard media={media} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
