import type { LibraryStatus } from "@/types/library";

export function isCompleted(
  status: LibraryStatus,
  progress: number,
  episodeCount: number | null,
) {
  return (
    status === "COMPLETED" ||
    (episodeCount !== null && episodeCount > 0 && progress >= episodeCount)
  );
}

export function completedLibraryData(
  status: LibraryStatus,
  progress: number,
  episodeCount: number | null,
) {
  const completed = isCompleted(status, progress, episodeCount);
  return {
    status: completed ? "COMPLETED" : status,
    completed,
    completedAt: completed ? new Date() : null,
  } as const;
}
