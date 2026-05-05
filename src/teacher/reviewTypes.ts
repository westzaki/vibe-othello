import type { Board, DiscColor, SquareIndex } from "../game/othello";
import type { MoveRecord } from "../game/session";
import type { TeacherGuidanceMode } from "./teacherGuidanceMove";

export type MoveReviewKind = "good" | "bad" | "neutral";

export type ReviewEvaluationSource = "minimax" | "exactEndgame";

export type MoveReviewReason =
  | "bestMove"
  | "nearBestMove"
  | "corner"
  | "mobilityGain"
  | "stablePosition"
  | "missedBestMove"
  | "cornerGiven"
  | "dangerSquare"
  | "mobilityLoss"
  | "scoreDrop"
  | "turningPoint";

export type CandidateMoveMetrics = {
  anchoredEdgeDelta: number;
  anchoredEdgeDifferenceAfter: number;
  anchoredEdgeDifferenceBefore: number;
  givesOpponentCorner: boolean;
  isCorner: boolean;
  isDangerSquare: boolean;
  mobilityDifferenceAfter: number;
  mobilityDifferenceBefore: number;
  mobilitySwing: number;
  opponentMobilityAfter: number;
  opponentMobilityBefore: number;
  opponentMobilityDelta: number;
  playerMobilityAfter: number;
  playerMobilityBefore: number;
  playerMobilityDelta: number;
  scoreGapFromBest: number;
};

export type CandidateMoveReview = {
  metrics: CandidateMoveMetrics;
  rank: number;
  reasons: MoveReviewReason[];
  score: number;
  square: SquareIndex;
};

export type MoveReview = {
  moveNumber: number;
  disc: DiscColor;
  square: SquareIndex;
  evaluationSource: ReviewEvaluationSource;
  kind: MoveReviewKind;
  reasons: MoveReviewReason[];
  scoreBefore: number;
  scoreAfter: number;
  bestSquare: SquareIndex | null;
  bestScore: number | null;
  playedScore: number;
};

export type PracticeFeedbackContext = Pick<
  MoveReview,
  "bestSquare" | "disc" | "reasons" | "scoreAfter" | "square"
>;

export type PracticeFeedback = {
  text: string;
};

export type ReviewMoveComparison = {
  nextFocus: string;
  playedMove: {
    explanation: string;
    playedScore: number;
    reasons: MoveReviewReason[];
    square: SquareIndex;
  };
  trialMove: {
    bestScore: number;
    explanation: string;
    reasons: MoveReviewReason[];
    square: SquareIndex;
  } | null;
};

export type ReviewedMove = MoveRecord & {
  candidateMoves: CandidateMoveReview[];
  review: MoveReview;
};

export type GameReview = {
  moveCount: number;
  reviewedDisc: DiscColor;
  reviewedMoves: ReviewedMove[];
  highlights: {
    goodMoves: ReviewedMove[];
    badMoves: ReviewedMove[];
  };
};

export type ReviewOutcome = "win" | "loss" | "draw";

export type ReviewCardKind = "niceMove" | "turningPoint" | "practiceTarget";

export type ReviewCard = {
  actionLabel?: string;
  bodyText: string;
  emptyText: string;
  footerText?: string;
  kind: ReviewCardKind;
  move: ReviewedMove | null;
  title: string;
};

export type ReviewLesson = {
  cards: ReviewCard[];
  niceMove: ReviewedMove | null;
  practiceTarget: ReviewedMove | null;
  turningPointCandidate: ReviewedMove | null;
};

export type MoveReviewMessage = {
  comparison?: ReviewMoveComparison;
  explanation: string;
  suggestion?: string;
};

export type GameReviewMessages = {
  advice: string;
  moveMessages: Map<number, MoveReviewMessage>;
};

export type ReviewGameOptions = {
  deepSearchDepth?: number;
  guidanceMode?: TeacherGuidanceMode;
  maxHighlights?: number;
  refutationSearchDepth?: number;
  reviewedDisc: DiscColor;
  searchDepth?: number;
  strongCandidateScoreGap?: number;
  topCandidateLimit?: number;
  turningPointAnalysis?: Partial<TurningPointAnalysisConfig>;
  useTeacherGuidanceMove?: boolean;
};

export type ReviewContext = {
  boardAfter: Board;
  boardBefore: Board;
  disc: DiscColor;
  square: SquareIndex;
};

export type EvaluationTimelineEntry = {
  delta: number;
  disc: DiscColor;
  moveNumber: number;
  scoreAfter: number;
  scoreBefore: number;
  square: SquareIndex;
};

export type TurningPointAnalysisConfig = {
  dropThreshold: number;
  lookaheadMoves: number;
  recoveryMargin: number;
};
