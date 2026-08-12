import { findSimilarMedia } from "@/lib/media/queries";
import type { MediaDetail } from "@/types/media";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaCard } from "@/components/media/media-card";

export async function SuspendedSimilarMedia({ media }: { media: MediaDetail }) {
  try {
    const similar = await findSimilarMedia(media);

    if (!similar.length) {
      return (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
          <p>We don't have any similar recommendations yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {similar.map((item) => (
          <MediaCard key={item.id} media={item} />
        ))}
      </div>
    );
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
        <h3 className="font-bold">Failed to load similar media</h3>
        <p className="font-mono text-xs mt-2 overflow-auto max-h-40">{msg}</p>
        <pre className="font-mono text-[10px] mt-2 overflow-auto max-h-40">{stack}</pre>
        <p className="font-mono text-xs mt-2">Error Object Keys: {Object.keys(error || {}).join(', ')}</p>
        <p className="font-mono text-xs mt-2">Error is null: {error === null ? 'yes' : 'no'}</p>
      </div>
    );
  }
}
