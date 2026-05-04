import type { MoveReview, MoveReviewReason, ReviewedMove } from "./reviewTypes";

const minimumNiceMoveNumber = 8;
const niceMoveReasonPriority: MoveReviewReason[] = [
  "corner",
  "mobilityGain",
  "stablePosition",
  "nearBestMove",
];
const winningPointReasonPriority: MoveReviewReason[] = [
  ...niceMoveReasonPriority,
  "bestMove",
];

export function selectReviewLessonMoves({
  badMoves,
  finalMoveNumber,
  goodMoves,
  reviewedMoves,
}: {
  badMoves: ReviewedMove[];
  finalMoveNumber: number;
  goodMoves: ReviewedMove[];
  reviewedMoves: ReviewedMove[];
}): {
  niceMove: ReviewedMove | null;
  practiceTarget: ReviewedMove | null;
  turningPointCandidate: ReviewedMove | null;
  winningPoint: ReviewedMove | null;
} {
  const niceMove = selectNiceMove(goodMoves, finalMoveNumber);
  const turningPointCandidate = selectTurningPointCandidate(badMoves);
  const practiceTarget = selectPracticeTarget(turningPointCandidate);
  const winningPoint =
    niceMove ??
    selectReproducibleWinningPoint(reviewedMoves, finalMoveNumber);

  return {
    niceMove,
    practiceTarget,
    turningPointCandidate,
    winningPoint,
  };
}

export function selectNiceMove(
  goodMoves: ReviewedMove[],
  finalMoveNumber = Number.POSITIVE_INFINITY,
): ReviewedMove | null {
  return (
    goodMoves
      .filter((move) => isMeaningfulNiceMove(move, finalMoveNumber))
      .sort(compareNiceMoves)[0] ?? null
  );
}

export function selectTurningPointCandidate(
  badMoves: ReviewedMove[],
): ReviewedMove | null {
  return [...badMoves].sort(compareLearningIssueMoves)[0] ?? null;
}

export function selectPracticeTarget(
  turningPointCandidate: ReviewedMove | null,
): ReviewedMove | null {
  if (
    turningPointCandidate === null ||
    turningPointCandidate.review.bestSquare === null ||
    turningPointCandidate.review.bestSquare ===
      turningPointCandidate.review.square
  ) {
    return null;
  }

  return turningPointCandidate;
}

export function compareLearningIssueMoves(
  firstMove: ReviewedMove,
  secondMove: ReviewedMove,
): number {
  const priorityDifference =
    getLearningIssuePriority(secondMove.review) -
    getLearningIssuePriority(firstMove.review);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return getScoreGap(secondMove.review) - getScoreGap(firstMove.review);
}

export function getLearningIssuePriority(review: MoveReview): number {
  if (
    review.reasons.includes("turningPoint") &&
    review.reasons.includes("cornerGiven")
  ) {
    return 7;
  }

  if (
    review.reasons.includes("turningPoint") &&
    review.reasons.includes("dangerSquare")
  ) {
    return 6;
  }

  if (review.reasons.includes("cornerGiven")) {
    return 5;
  }

  if (review.reasons.includes("turningPoint")) {
    return 4;
  }

  if (review.reasons.includes("dangerSquare")) {
    return 3;
  }

  if (review.reasons.includes("mobilityLoss")) {
    return 2;
  }

  return 1;
}

function selectReproducibleWinningPoint(
  reviewedMoves: ReviewedMove[],
  finalMoveNumber: number,
): ReviewedMove | null {
  return (
    reviewedMoves
      .filter((move) => isReproducibleWinningPoint(move, finalMoveNumber))
      .sort(compareWinningPoints)[0] ?? null
  );
}

function isMeaningfulNiceMove(
  move: ReviewedMove,
  finalMoveNumber: number,
): boolean {
  return (
    move.moveNumber >= minimumNiceMoveNumber &&
    !isFinalReviewedMove(move, finalMoveNumber) &&
    move.review.reasons.some((reason) =>
      niceMoveReasonPriority.includes(reason),
    )
  );
}

function isReproducibleWinningPoint(
  move: ReviewedMove,
  finalMoveNumber: number,
): boolean {
  return (
    move.moveNumber >= minimumNiceMoveNumber &&
    !isFinalReviewedMove(move, finalMoveNumber) &&
    move.review.kind !== "bad" &&
    move.review.reasons.some((reason) =>
      winningPointReasonPriority.includes(reason),
    )
  );
}

function compareNiceMoves(
  firstMove: ReviewedMove,
  secondMove: ReviewedMove,
): number {
  const priorityDifference =
    getNiceMovePriority(secondMove) - getNiceMovePriority(firstMove);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return firstMove.moveNumber - secondMove.moveNumber;
}

function getNiceMovePriority(move: ReviewedMove): number {
  return Math.max(
    ...move.review.reasons.map((reason) => {
      const index = niceMoveReasonPriority.indexOf(reason);

      return index === -1 ? 0 : niceMoveReasonPriority.length - index;
    }),
  );
}

function compareWinningPoints(
  firstMove: ReviewedMove,
  secondMove: ReviewedMove,
): number {
  const priorityDifference =
    getWinningPointPriority(secondMove) - getWinningPointPriority(firstMove);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const kindDifference =
    getWinningPointKindPriority(secondMove) -
    getWinningPointKindPriority(firstMove);

  if (kindDifference !== 0) {
    return kindDifference;
  }

  const scoreGapDifference =
    getScoreGap(firstMove.review) - getScoreGap(secondMove.review);

  if (scoreGapDifference !== 0) {
    return scoreGapDifference;
  }

  return firstMove.moveNumber - secondMove.moveNumber;
}

function getWinningPointPriority(move: ReviewedMove): number {
  return Math.max(
    ...move.review.reasons.map((reason) => {
      const index = winningPointReasonPriority.indexOf(reason);

      return index === -1 ? 0 : winningPointReasonPriority.length - index;
    }),
  );
}

function getWinningPointKindPriority(move: ReviewedMove): number {
  return move.review.kind === "good" ? 1 : 0;
}

function getScoreGap(review: MoveReview): number {
  return review.bestScore === null ? 0 : review.bestScore - review.playedScore;
}

function isFinalReviewedMove(
  move: ReviewedMove,
  finalMoveNumber: number,
): boolean {
  return move.moveNumber >= finalMoveNumber;
}
