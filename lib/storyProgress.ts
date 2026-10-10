export interface StoryProgressInput {
  completedChapters: number;
  totalChapters: number;
}

export function calculateStoryProgress({
  completedChapters,
  totalChapters,
}: StoryProgressInput): number {
  if (
    !Number.isFinite(totalChapters) ||
    totalChapters <= 0
  ) {
    return 0;
  }

  if (
    !Number.isFinite(completedChapters) ||
    completedChapters <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.round(
      (completedChapters /
        totalChapters) *
        100
    ),
    100
  );
}