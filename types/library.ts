export const libraryStatuses = [
  "WATCHING",
  "COMPLETED",
  "PLAN_TO_WATCH",
  "ON_HOLD",
  "DROPPED",
] as const;
export type LibraryStatus = (typeof libraryStatuses)[number];
export const LIBRARY_STATUS_LABELS: Record<LibraryStatus, string> = {
  WATCHING: "Watching",
  COMPLETED: "Completed",
  PLAN_TO_WATCH: "Plan to watch",
  ON_HOLD: "On hold",
  DROPPED: "Dropped",
};

export type LibraryEntry = {
  id: string;
  status: LibraryStatus;
  progress: number;
  completed: boolean;
  startedAt: string | null;
  completedAt: string | null;
  watchCount: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  media: import("@/types/media").MediaSummary & {
    episodeCount: number | null;
    runtime: number | null;
  };
  rating: number | null;
};

export type WishlistEntry = {
  id: string;
  priority: number;
  note: string | null;
  position: number;
  createdAt: string;
  media: import("@/types/media").MediaSummary;
};
