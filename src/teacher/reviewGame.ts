import { strategicEvaluateBoard } from "../cpu";
import type { MoveRecord } from "../game/session";
import type {
  GameReview,
  MoveReview,
  MoveReviewKind,
  MoveReviewReason,
  ReviewGameOptions,
  ReviewedMove,
} from "./reviewTypes";
import {
  analyzeMoveCandidates,
  getMoveCandidateReasons,
  type MoveCandidateAnalysis,
} from "./analyzeMoveCandidates";
import {
  createEvaluationTimeline,
  findTurningPointMoveNumbers,
} from "./evaluationTimeline";
import { compareLearningIssueMoves } from "./reviewLessonSelection";
import { selectTeacherGuidanceCandidate } from "./teacherGuidanceMove";

const defaultSearchDepth = 3;
const defaultMaxHighlights = 2;
const goodMoveScoreGap = 8;
const badMoveScoreGap = 28;

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
      reviewMove({
        move,
        options,
        searchDepth,
        isTurningPoint: turningPointMoveNumbers.has(move.moveNumber),
      }),
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

function reviewMove({
  isTurningPoint,
  move,
  options,
  searchDepth,
}: {
  isTurningPoint: boolean;
  move: MoveRecord;
  options: ReviewGameOptions;
  searchDepth: number;
}): ReviewedMove {
  const candidateAnalysis = analyzeMoveCandidates(move.boardBefore, move.disc, {
    searchDepth,
  });
  const candidateMoves = candidateAnalysis.candidateMoves;
  const bestCandidate = getReviewBestCandidate({
    analysis: candidateAnalysis,
    move,
    options,
  });
  const playedCandidate =
    candidateMoves.find((candidate) => candidate.square === move.square) ??
    null;
  const playedScore =
    playedCandidate?.score ??
    strategicEvaluateBoard(move.boardAfter, move.disc);
  const bestScore = bestCandidate?.score ?? null;
  const scoreGap = bestScore === null ? 0 : bestScore - playedScore;
  const reasons = getMoveReasons(
    scoreGap,
    isTurningPoint,
    playedCandidate?.reasons ??
      getMoveCandidateReasons({
        boardAfter: move.boardAfter,
        boardBefore: move.boardBefore,
        disc: move.disc,
        square: move.square,
      }),
  );
  const kind = getMoveReviewKind(scoreGap, reasons);

  return {
    ...move,
    candidateMoves,
    review: {
      moveNumber: move.moveNumber,
      disc: move.disc,
      square: move.square,
      evaluationSource: candidateAnalysis.evaluationSource,
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

function getReviewBestCandidate({
  analysis,
  move,
  options,
}: {
  analysis: MoveCandidateAnalysis;
  move: MoveRecord;
  options: ReviewGameOptions;
}): ReviewedMove["candidateMoves"][number] | null {
  if (!options.useTeacherGuidanceMove) {
    return analysis.candidateMoves[0] ?? null;
  }

  return (
    selectTeacherGuidanceCandidate({
      analysis,
      board: move.boardBefore,
      deepSearchDepth: options.deepSearchDepth,
      disc: move.disc,
      guidanceMode: options.guidanceMode,
      refutationSearchDepth: options.refutationSearchDepth,
      strongCandidateScoreGap: options.strongCandidateScoreGap,
      topCandidateLimit: options.topCandidateLimit,
    }) ??
    analysis.candidateMoves[0] ??
    null
  );
}

function getMoveReasons(
  scoreGap: number,
  isTurningPoint: boolean,
  candidateReasons: MoveReviewReason[],
): MoveReviewReason[] {
  const reasons: MoveReviewReason[] = [];

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

  pushUniqueReasons(reasons, candidateReasons);

  if (reasons.length === 0) {
    reasons.push("stablePosition");
  }

  return reasons;
}

function pushUniqueReasons(
  reasons: MoveReviewReason[],
  nextReasons: MoveReviewReason[],
): void {
  for (const reason of nextReasons) {
    if (!reasons.includes(reason)) {
      reasons.push(reason);
    }
  }
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
