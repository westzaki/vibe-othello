import type { ReviewGameOptions } from "./reviewTypes";

export type TeacherReviewConfig = Pick<
  ReviewGameOptions,
  "maxHighlights" | "searchDepth"
>;

export const defaultTeacherReviewConfig: TeacherReviewConfig = {
  maxHighlights: 2,
  searchDepth: 3,
};
