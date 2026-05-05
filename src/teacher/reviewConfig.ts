import type { ReviewGameOptions } from "./reviewTypes";

export type TeacherReviewConfig = Pick<
  ReviewGameOptions,
  | "deepSearchDepth"
  | "maxHighlights"
  | "refutationSearchDepth"
  | "searchDepth"
  | "strongCandidateScoreGap"
  | "topCandidateLimit"
  | "turningPointAnalysis"
  | "useTeacherGuidanceMove"
>;

export const defaultTeacherReviewConfig: TeacherReviewConfig = {
  maxHighlights: 2,
  searchDepth: 3,
  turningPointAnalysis: {
    dropThreshold: 30,
    lookaheadMoves: 4,
    recoveryMargin: 10,
  },
  useTeacherGuidanceMove: true,
};
