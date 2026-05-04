import type { MoveReview, MoveReviewReason, ReviewedMove } from "./reviewTypes";

const minimumNiceMoveNumber = 8;
const niceMoveReasonPriority: MoveReviewReason[] = [
  "corner",
  "mobilityGain",
  "stablePosition",
  "nearBestMove",
];

export function selectReviewLessonMoves({
  badMoves,
  goodMoves,
}: {
  badMoves: ReviewedMove[];
  goodMoves: ReviewedMove[];
}): {
  niceMove: ReviewedMove | null;
  practiceTarget: ReviewedMove | null;
  turningPointCandidate: ReviewedMove | null;
} {
  const niceMove = selectNiceMove(goodMoves);
  const turningPointCandidate = selectTurningPointCandidate(badMoves);
  const practiceTarget = selectPracticeTarget(turningPointCandidate);

  return {
    niceMove,
    practiceTarget,
    turningPointCandidate,
  };
}

export function selectNiceMove(goodMoves: ReviewedMove[]): ReviewedMove | null {
  return (
    goodMoves.filter(isMeaningfulNiceMove).sort(compareNiceMoves)[0] ?? null
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

function isMeaningfulNiceMove(move: ReviewedMove): boolean {
  return (
    move.moveNumber >= minimumNiceMoveNumber &&
    move.review.reasons.some((reason) =>
      niceMoveReasonPriority.includes(reason),
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

function getScoreGap(review: MoveReview): number {
  return review.bestScore === null ? 0 : review.bestScore - review.playedScore;
}
