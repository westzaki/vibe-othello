import type { ReviewGameOptions } from "./reviewTypes";

export type TeacherReviewConfig = Pick<
  ReviewGameOptions,
  "maxHighlights" | "searchDepth" | "turningPointAnalysis"
>;

export const defaultTeacherReviewConfig: TeacherReviewConfig = {
  maxHighlights: 2,
  searchDepth: 3,
  turningPointAnalysis: {
    dropThreshold: 30,
    lookaheadMoves: 4,
    recoveryMargin: 10,
  },
};
