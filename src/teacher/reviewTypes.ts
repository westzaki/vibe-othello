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
  | "scoreDrop";

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

export type MoveReviewMessage = {
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
};

export type ReviewContext = {
  boardAfter: Board;
  boardBefore: Board;
  disc: DiscColor;
  square: SquareIndex;
};
