import { strategicEvaluateBoard } from "../cpu";
import type { SquareIndex } from "../game/othello";
import type { MoveRecord } from "../game/session";
import type {
  PracticeFeedback,
  PracticeFeedbackContext,
  ReviewedMove,
} from "./reviewTypes";

const meaningfulScoreGain = 5;

export function createPracticeFeedback(
  context: PracticeFeedbackContext | null,
  practicedMove: MoveRecord | null,
): PracticeFeedback | null {
  if (context === null || practicedMove === null) {
    return null;
  }

  if (
    context.bestSquare !== null &&
    practicedMove.square === context.bestSquare
  ) {
    return {
      text: `${formatSquare(practicedMove.square)}を試せたね。さっき見たポイントにつながっていていい感じ。`,
    };
  }

  if (
    practicedMove.square !== context.square &&
    context.reasons.includes("cornerGiven")
  ) {
    return {
      text: "いいね、さっきより相手に角チャンスをあげにくい形を試せたかも。",
    };
  }

  if (
    practicedMove.square !== context.square &&
    context.reasons.includes("dangerSquare")
  ) {
    return {
      text: "角の近くをもう一回見て、別の形を試せたね。いい見直しだと思う。",
    };
  }

  if (
    context.reasons.includes("mobilityLoss") &&
    isPracticeScoreImproved(context, practicedMove)
  ) {
    return {
      text: "置いたあとに自分の置ける場所を残しやすい形かも。次につながる一手だね。",
    };
  }

  if (practicedMove.square !== context.square) {
    return {
      text: "いいね、さっきと違う形を試せたね。比べ直せていていい感じ。",
    };
  }

  return {
    text: "もう一回この局面を考えられたね。置いたあとに相手のチャンスも見てみよう。",
  };
}

export function createPracticeFeedbackContext(
  reviewedMove: ReviewedMove,
): PracticeFeedbackContext {
  return {
    bestSquare: reviewedMove.review.bestSquare,
    disc: reviewedMove.review.disc,
    reasons: [...reviewedMove.review.reasons],
    scoreAfter: reviewedMove.review.scoreAfter,
    square: reviewedMove.review.square,
  };
}

function isPracticeScoreImproved(
  context: PracticeFeedbackContext,
  practicedMove: MoveRecord,
): boolean {
  const practicedScore = strategicEvaluateBoard(
    practicedMove.boardAfter,
    context.disc,
  );

  return practicedScore >= context.scoreAfter + meaningfulScoreGain;
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
