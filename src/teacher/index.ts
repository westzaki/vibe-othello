// Public API for the teacher package.
// UI and future analysis screens should depend on these exports instead of
// reaching into the engine/message modules directly.
export { createPositionReview } from "./createPositionReview";
export type { PositionReview } from "./createPositionReview";
export { createReviewLesson } from "./createReviewLesson";
export { defaultTeacherReviewConfig } from "./reviewConfig";
export type { TeacherReviewConfig } from "./reviewConfig";
export { reviewGame } from "./reviewGame";
export {
  createGameReviewMessages,
  createMoveReviewMessage,
} from "./reviewMessages";
export type {
  CandidateMoveReview,
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
} from "./reviewTypes";
