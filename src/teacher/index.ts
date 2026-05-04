// Public API for the teacher package.
// UI and future analysis screens should depend on these exports instead of
// reaching into the engine/message modules directly.
export { createPositionReview } from "./createPositionReview";
export type { PositionReview } from "./createPositionReview";
export {
  createEvaluationTimeline,
  defaultTurningPointAnalysisConfig,
  findTurningPointMoveNumbers,
} from "./evaluationTimeline";
export { createReviewLesson } from "./createReviewLesson";
export { defaultTeacherReviewConfig } from "./reviewConfig";
export type { TeacherReviewConfig } from "./reviewConfig";
export { reviewGame } from "./reviewGame";
export {
  createGameReviewMessages,
  createMoveReviewMessage,
} from "./reviewMessages";
export {
  compareLearningIssueMoves,
  getLearningIssuePriority,
  selectNiceMove,
  selectPracticeTarget,
  selectReviewLessonMoves,
  selectTurningPointCandidate,
} from "./reviewLessonSelection";
export type {
  CandidateMoveReview,
  EvaluationTimelineEntry,
  GameReview,
  GameReviewMessages,
  MoveReview,
  MoveReviewKind,
  MoveReviewMessage,
  MoveReviewReason,
  ReviewCard,
  ReviewCardKind,
  ReviewMoveComparison,
  ReviewedMove,
  ReviewGameOptions,
  ReviewLesson,
  TurningPointAnalysisConfig,
} from "./reviewTypes";
