import { getUserMediaState } from "@/lib/library/queries";
import { MediaActions } from "./media-actions";

export async function MediaActionsWrapper({
  mediaId,
  episodeCount,
  userId,
}: {
  mediaId: string;
  episodeCount: number | null;
  userId: string;
}) {
  const userState = await getUserMediaState(userId, mediaId);

  return (
    <MediaActions
      mediaId={mediaId}
      initialStatus={userState?.library?.status ?? null}
      inWishlist={Boolean(userState?.wishlist)}
      initialRating={userState?.rating?.rating ? Number(userState.rating.rating) : null}
      initialProgress={userState?.library?.progress ?? 0}
      episodeCount={episodeCount}
      libraryEntryId={userState?.library?.id ?? null}
    />
  );
}
