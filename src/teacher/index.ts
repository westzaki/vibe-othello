// Public API for the teacher package.
// UI and future analysis screens should depend on these exports instead of
// reaching into the engine/message modules directly.
export {
  analyzeMoveCandidates,
  getMoveCandidateReasons,
} from "./analyzeMoveCandidates";
export type {
  AnalyzeMoveCandidatesOptions,
  MoveCandidateAnalysis,
} from "./analyzeMoveCandidates";
export { createPositionReview } from "./createPositionReview";
export type { PositionReview } from "./createPositionReview";
export { createPlayPositionAnalysis } from "./createPlayPositionAnalysis";
export type {
  CreatePlayPositionAnalysisOptions,
  PlayPositionAdvantageSource,
  PlayPositionAnalysis,
  PlayPositionConfidence,
  PlayPositionMoveEvaluationSource,
  PlayPositionPhase,
} from "./createPlayPositionAnalysis";
export {
  createEvaluationTimeline,
  defaultTurningPointAnalysisConfig,
  findTurningPointMoveNumbers,
} from "./evaluationTimeline";
export {
  createPracticeFeedback,
  createPracticeFeedbackContext,
} from "./practiceFeedback";
export {
  createCoachHint,
  createCoachHints,
  createCoachHintsFromAnalysis,
} from "./createCoachHint";
export type {
  CoachHint,
  CoachHintKind,
  CoachHintMessageStyle,
  CreateCoachHintOptions,
  CreateCoachHintsFromAnalysisOptions,
} from "./createCoachHint";
export {
  canShowCoachHint,
  createCoachHintModel,
  defaultCoachHintSettings,
} from "./coachHintModel";
export type {
  CoachHintMode,
  CoachHintModel,
  CoachHintSettings,
  CoachHintVisibilityContext,
} from "./coachHintModel";
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
  PracticeFeedback,
  PracticeFeedbackContext,
  ReviewEvaluationSource,
  ReviewCard,
  ReviewCardKind,
  ReviewMoveComparison,
  ReviewedMove,
  ReviewGameOptions,
  ReviewLesson,
  ReviewOutcome,
  TurningPointAnalysisConfig,
} from "./reviewTypes";
