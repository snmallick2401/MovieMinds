import { findSimilarMedia } from "@/lib/media/queries";
import type { MediaDetail } from "@/types/media";
import { MediaGrid } from "@/components/media/media-grid";

export async function SuspendedSimilarMedia({ media }: { media: MediaDetail }) {
  const similar = await findSimilarMedia(media);
  return (
    <MediaGrid
      items={similar}
      emptyMessage="More related titles will appear as the catalog grows."
    />
  );
}
