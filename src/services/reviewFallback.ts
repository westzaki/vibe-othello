import type { ReviewGameOptions } from "../teacher";

export function createLightweightReviewGameOptions(
  options: ReviewGameOptions,
): ReviewGameOptions {
  if (!options.useTeacherGuidanceMove) {
    return options;
  }

  return {
    ...options,
    useTeacherGuidanceMove: false,
  };
}
