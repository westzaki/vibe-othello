import type { Board, DiscColor, SquareIndex } from "../game/othello";
import type { MoveRecord } from "../game/session";

export type MoveReviewKind = "good" | "bad" | "neutral";

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

export type CandidateMoveReview = {
  square: SquareIndex;
  score: number;
  rank: number;
  reasons: MoveReviewReason[];
};

export type MoveReview = {
  moveNumber: number;
  disc: DiscColor;
  square: SquareIndex;
  kind: MoveReviewKind;
  reasons: MoveReviewReason[];
  scoreBefore: number;
  scoreAfter: number;
  bestSquare: SquareIndex | null;
  bestScore: number | null;
  playedScore: number;
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
  reviewedDisc: DiscColor;
  reviewedMoves: ReviewedMove[];
  highlights: {
    goodMoves: ReviewedMove[];
    badMoves: ReviewedMove[];
  };
};

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
  maxHighlights?: number;
  reviewedDisc: DiscColor;
  searchDepth?: number;
  turningPointAnalysis?: Partial<TurningPointAnalysisConfig>;
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
