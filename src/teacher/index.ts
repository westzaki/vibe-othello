// Public API for the teacher package.
// UI and future analysis screens should depend on these exports instead of
// reaching into the engine/message modules directly.
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
  ReviewedMove,
  ReviewGameOptions,
} from "./reviewTypes";
