import { describe, expect, it } from "vitest";
import { createEmptyBoard, type Board, type DiscColor } from "../game/othello";
import type { MoveRecord } from "../game/session";
import { createPracticeFeedback } from "./practiceFeedback";
import type { PracticeFeedbackContext } from "./reviewTypes";

describe("practice feedback", () => {
  it("praises a practiced move that matches the trial move", () => {
    const feedback = createPracticeFeedback(
      createFeedbackContext({ bestSquare: 26, square: 20 }),
      createMoveRecord({ square: 26 }),
    );

    expect(feedback?.text).toContain("C4を試せたね");
    expect(feedback?.text).not.toContain("正解");
  });

  it("creates fallback feedback for a different move without crashing", () => {
    const feedback = createPracticeFeedback(
      createFeedbackContext({ bestSquare: 26, square: 20 }),
      createMoveRecord({ square: 21 }),
    );

    expect(feedback?.text).toContain("違う形を試せたね");
  });

  it("creates fallback feedback when bestSquare is null", () => {
    const feedback = createPracticeFeedback(
      createFeedbackContext({ bestSquare: null, square: 20 }),
      createMoveRecord({ square: 21 }),
    );

    expect(feedback?.text).not.toHaveLength(0);
  });

  it.each([
    ["cornerGiven" as const, "角チャンス"],
    ["dangerSquare" as const, "角の近く"],
  ])("creates reason-based feedback for %s", (reason, expectedText) => {
    const feedback = createPracticeFeedback(
      createFeedbackContext({
        bestSquare: 26,
        reasons: [reason],
        square: 20,
      }),
      createMoveRecord({ square: 21 }),
    );

    expect(feedback?.text).toContain(expectedText);
  });

  it("praises a mobilityLoss practice move when the evaluated shape improves", () => {
    const feedback = createPracticeFeedback(
      createFeedbackContext({
        bestSquare: 26,
        reasons: ["mobilityLoss"],
        scoreAfter: -20,
        square: 20,
      }),
      createMoveRecord({
        boardAfter: createBoardWithDiscs({
          0: "black",
          7: "black",
          27: "black",
        }),
        square: 21,
      }),
    );

    expect(feedback?.text).toContain("置ける場所");
  });

  it("returns null until both context and practiced move are available", () => {
    expect(
      createPracticeFeedback(null, createMoveRecord({ square: 20 })),
    ).toBeNull();
    expect(createPracticeFeedback(createFeedbackContext({}), null)).toBeNull();
  });
});

function createFeedbackContext({
  bestSquare = 26,
  disc = "black",
  reasons = ["turningPoint"],
  scoreAfter = 0,
  square = 20,
}: Partial<PracticeFeedbackContext> = {}): PracticeFeedbackContext {
  return {
    bestSquare,
    disc,
    reasons,
    scoreAfter,
    square,
  };
}

function createMoveRecord({
  boardAfter = createEmptyBoard(),
  disc = "black",
  square,
}: {
  boardAfter?: Board;
  disc?: DiscColor;
  square: number;
}): MoveRecord {
  const boardBefore = createEmptyBoard();

  return {
    boardAfter,
    boardBefore,
    disc,
    flippedSquares: [],
    legalMovesBefore: [square],
    moveNumber: 1,
    square,
  };
}

function createBoardWithDiscs(discs: Record<number, DiscColor>): Board {
  const board = createEmptyBoard();

  for (const [index, disc] of Object.entries(discs)) {
    board[Number(index)] = disc;
  }

  return board;
}
