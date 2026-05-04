import { describe, expect, it } from "vitest";
import { createEmptyBoard, type SquareIndex } from "../../game/othello";
import type { ReviewCard, ReviewedMove } from "../../teacher";
import { getPracticeActionMove, getReviewCardMoves } from "./reviewLessonDisplay";

describe("review lesson display", () => {
  it("does not display the practice target as a duplicate move card", () => {
    const turningPointMove = createReviewedMove(52);
    const turningPointCard = createReviewCard("turningPoint", turningPointMove);
    const practiceCard = createReviewCard("practiceTarget", turningPointMove);

    expect(getReviewCardMoves(turningPointCard)).toEqual([turningPointMove]);
    expect(getReviewCardMoves(practiceCard)).toEqual([]);
    expect(getPracticeActionMove(practiceCard)).toBe(turningPointMove);
  });
});

function createReviewCard(
  kind: ReviewCard["kind"],
  move: ReviewedMove | null,
): ReviewCard {
  return {
    bodyText: "",
    emptyText: "",
    kind,
    move,
    title: "",
  };
}

function createReviewedMove(square: SquareIndex): ReviewedMove {
  const board = createEmptyBoard();

  return {
    boardAfter: board,
    boardBefore: board,
    candidateMoves: [],
    disc: "black",
    flippedSquares: [],
    legalMovesBefore: [square],
    moveNumber: 53,
    review: {
      bestScore: null,
      bestSquare: null,
      disc: "black",
      evaluationSource: "minimax",
      kind: "bad",
      moveNumber: 53,
      playedScore: 0,
      reasons: ["scoreDrop"],
      scoreAfter: 0,
      scoreBefore: 0,
      square,
    },
    square,
  };
}
