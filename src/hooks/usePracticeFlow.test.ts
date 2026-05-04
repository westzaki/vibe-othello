import { describe, expect, it } from "vitest";
import { createInitialBoard } from "../game/othello";
import { createDefaultPlayerSettings } from "../game/players";
import type { MoveRecord } from "../game/session";
import { getFirstHumanPracticeMove } from "./usePracticeFlow";

describe("practice flow helpers", () => {
  it("finds only the first human move for practice feedback", () => {
    const players = createDefaultPlayerSettings();
    const cpuMove = createMoveRecord({
      disc: "white",
      moveNumber: 1,
      square: 18,
    });
    const firstHumanMove = createMoveRecord({
      disc: "black",
      moveNumber: 2,
      square: 26,
    });
    const secondHumanMove = createMoveRecord({
      disc: "black",
      moveNumber: 4,
      square: 37,
    });

    expect(
      getFirstHumanPracticeMove(
        [cpuMove, firstHumanMove, secondHumanMove],
        players,
      ),
    ).toBe(firstHumanMove);
  });
});

function createMoveRecord({
  disc,
  moveNumber,
  square,
}: {
  disc: MoveRecord["disc"];
  moveNumber: number;
  square: number;
}): MoveRecord {
  const board = createInitialBoard();

  return {
    boardAfter: board,
    boardBefore: board,
    disc,
    flippedSquares: [],
    legalMovesBefore: [square],
    moveNumber,
    square,
  };
}
