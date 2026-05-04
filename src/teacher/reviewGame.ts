import {
  getMinimaxMoveScores,
  getMobilityDifference,
  strategicEvaluateBoard,
} from "../cpu";
import {
  CORNER_SQUARES,
  getLegalMoves,
  getNextDisc,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import type { MoveRecord } from "../game/session";
import type {
  CandidateMoveReview,
  GameReview,
  MoveReview,
  MoveReviewKind,
  MoveReviewReason,
  ReviewContext,
  ReviewGameOptions,
  ReviewedMove,
} from "./reviewTypes";
import {
  createEvaluationTimeline,
  findTurningPointMoveNumbers,
} from "./evaluationTimeline";
import { compareLearningIssueMoves } from "./reviewLessonSelection";

const defaultSearchDepth = 3;
const defaultMaxHighlights = 2;
const goodMoveScoreGap = 8;
const badMoveScoreGap = 28;
const mobilitySwingThreshold = 3;
const dangerSquaresByCorner = new Map<SquareIndex, SquareIndex[]>([
  [0, [1, 8, 9]],
  [7, [6, 14, 15]],
  [56, [48, 49, 57]],
  [63, [54, 55, 62]],
]);

export function reviewGame(
  moveHistory: MoveRecord[],
  options: ReviewGameOptions,
): GameReview {
  const searchDepth = options.searchDepth ?? defaultSearchDepth;
  const maxHighlights = options.maxHighlights ?? defaultMaxHighlights;
  const evaluationTimeline = createEvaluationTimeline(
    moveHistory,
    options.reviewedDisc,
  );
  const turningPointMoveNumbers = new Set(
    findTurningPointMoveNumbers(
      evaluationTimeline,
      options.reviewedDisc,
      options.turningPointAnalysis,
    ),
  );
  const reviewedMoves = moveHistory
    .filter((move) => move.disc === options.reviewedDisc)
    .map((move) =>
      reviewMove(
        move,
        searchDepth,
        turningPointMoveNumbers.has(move.moveNumber),
      ),
    );

  return {
    moveCount: moveHistory.length,
    reviewedDisc: options.reviewedDisc,
    reviewedMoves,
    highlights: {
      goodMoves: getHighlightedMoves(reviewedMoves, "good", maxHighlights),
      badMoves: getHighlightedMoves(reviewedMoves, "bad", maxHighlights),
    },
  };
}

function reviewMove(
  move: MoveRecord,
  searchDepth: number,
  isTurningPoint: boolean,
): ReviewedMove {
  const moveScores = getMinimaxMoveScores(move.boardBefore, move.disc, {
    searchDepth,
  });
  const candidateMoves = moveScores.map<CandidateMoveReview>(
    ({ move: square, score }, index) => ({
      square,
      score,
      rank: index + 1,
      reasons: getCandidateReasons({
        boardAfter: move.boardAfter,
        boardBefore: move.boardBefore,
        disc: move.disc,
        square,
      }),
    }),
  );
  const bestCandidate = candidateMoves[0] ?? null;
  const playedCandidate =
    candidateMoves.find((candidate) => candidate.square === move.square) ??
    null;
  const playedScore =
    playedCandidate?.score ??
    strategicEvaluateBoard(move.boardAfter, move.disc);
  const bestScore = bestCandidate?.score ?? null;
  const scoreGap = bestScore === null ? 0 : bestScore - playedScore;
  const reasons = getMoveReasons(move, scoreGap, isTurningPoint);
  const kind = getMoveReviewKind(scoreGap, reasons);

  return {
    ...move,
    candidateMoves,
    review: {
      moveNumber: move.moveNumber,
      disc: move.disc,
      square: move.square,
      kind,
      reasons,
      scoreBefore: strategicEvaluateBoard(move.boardBefore, move.disc),
      scoreAfter: strategicEvaluateBoard(move.boardAfter, move.disc),
      bestSquare: bestCandidate?.square ?? null,
      bestScore,
      playedScore,
    },
  };
}

function getCandidateReasons(context: ReviewContext): MoveReviewReason[] {
  const reasons: MoveReviewReason[] = [];

  if (isCorner(context.square)) {
    reasons.push("corner");
  }

  if (isDangerSquare(context.boardBefore, context.square)) {
    reasons.push("dangerSquare");
  }

  return reasons;
}

function getMoveReasons(
  move: MoveRecord,
  scoreGap: number,
  isTurningPoint: boolean,
): MoveReviewReason[] {
  const reasons: MoveReviewReason[] = [];
  const mobilityBefore = getMobilityDifference(move.boardBefore, move.disc);
  const mobilityAfter = getMobilityDifference(move.boardAfter, move.disc);
  const mobilitySwing = mobilityAfter - mobilityBefore;

  if (scoreGap <= 0) {
    reasons.push("bestMove");
  } else if (scoreGap <= goodMoveScoreGap) {
    reasons.push("nearBestMove");
  }

  if (scoreGap >= badMoveScoreGap) {
    reasons.push("missedBestMove", "scoreDrop");
  }

  if (isTurningPoint) {
    reasons.push("turningPoint");
  }

  if (isCorner(move.square)) {
    reasons.push("corner");
  }

  if (isDangerSquare(move.boardBefore, move.square)) {
    reasons.push("dangerSquare");
  }

  if (newlyGivesCorner(move.boardBefore, move.boardAfter, move.disc)) {
    reasons.push("cornerGiven");
  }

  if (mobilitySwing >= mobilitySwingThreshold) {
    reasons.push("mobilityGain");
  }

  if (mobilitySwing <= -mobilitySwingThreshold) {
    reasons.push("mobilityLoss");
  }

  if (reasons.length === 0) {
    reasons.push("stablePosition");
  }

  return reasons;
}

function getMoveReviewKind(
  scoreGap: number,
  reasons: MoveReviewReason[],
): MoveReviewKind {
  if (
    scoreGap >= badMoveScoreGap ||
    reasons.includes("turningPoint") ||
    reasons.includes("cornerGiven") ||
    (scoreGap > goodMoveScoreGap && reasons.includes("dangerSquare"))
  ) {
    return "bad";
  }

  if (
    scoreGap <= goodMoveScoreGap ||
    reasons.includes("corner") ||
    reasons.includes("mobilityGain")
  ) {
    return "good";
  }

  return "neutral";
}

function getHighlightedMoves(
  reviewedMoves: ReviewedMove[],
  kind: MoveReviewKind,
  maxHighlights: number,
): ReviewedMove[] {
  return reviewedMoves
    .filter((move) => move.review.kind === kind)
    .sort((firstMove, secondMove) => {
      if (kind === "bad") {
        return compareLearningIssueMoves(firstMove, secondMove);
      }

      return getScoreGap(firstMove.review) - getScoreGap(secondMove.review);
    })
    .slice(0, maxHighlights);
}

function getScoreGap(review: MoveReview): number {
  return review.bestScore === null ? 0 : review.bestScore - review.playedScore;
}

function newlyGivesCorner(
  boardBefore: ReviewContext["boardBefore"],
  boardAfter: ReviewContext["boardAfter"],
  disc: DiscColor,
) {
  const opponentDisc = getNextDisc(disc);
  const cornerMovesBefore = getLegalMoves(boardBefore, opponentDisc).filter(
    isCorner,
  );
  const cornerMovesAfter = getLegalMoves(boardAfter, opponentDisc).filter(
    isCorner,
  );

  return cornerMovesAfter.some(
    (cornerMove) => !cornerMovesBefore.includes(cornerMove),
  );
}

function isCorner(square: SquareIndex): boolean {
  return CORNER_SQUARES.some((corner) => corner === square);
}

function isDangerSquare(
  board: ReviewContext["boardBefore"],
  square: SquareIndex,
) {
  for (const [corner, dangerSquares] of dangerSquaresByCorner) {
    if (board[corner] === null && dangerSquares.includes(square)) {
      return true;
    }
  }

  return false;
}
