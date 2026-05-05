import type { ReviewGameOptions } from "./reviewTypes";

export type TeacherReviewConfig = Pick<
  ReviewGameOptions,
  | "deepSearchDepth"
  | "guidanceMode"
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
  guidanceMode: "auto",
  searchDepth: 3,
  turningPointAnalysis: {
    dropThreshold: 30,
    lookaheadMoves: 4,
    recoveryMargin: 10,
  },
  useTeacherGuidanceMove: true,
};
