import type { ReviewCard, ReviewedMove } from "../../teacher";

export function getReviewCardMoves(card: ReviewCard): ReviewedMove[] {
  if (card.kind === "practiceTarget" || card.move === null) {
    return [];
  }

  return [card.move];
}

export function getPracticeActionMove(card: ReviewCard): ReviewedMove | null {
  return card.kind === "practiceTarget" ? card.move : null;
}
