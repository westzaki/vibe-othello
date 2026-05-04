import { describe, expect, it } from "vitest";
import { createInitialBoard, getLegalMoves } from "../../game/othello";
import { createBoardFixture } from "../../test/boardFixtures";
import {
  chooseGrandmasterMove,
  chooseIterativeDeepeningMove,
  getPerfectEndgameMoveScores,
  choosePerfectEndgameMove,
} from "./grandmasterStrategy";

describe("grandmaster CPU", () => {
  it("uses iterative deepening before the endgame", () => {
    const board = createInitialBoard();

    expect(chooseGrandmasterMove(board, "black")).toBe(
      chooseIterativeDeepeningMove(board, "black"),
    );
  });

  it("returns a legal move from iterative deepening", () => {
    const board = createInitialBoard();
    const move = chooseIterativeDeepeningMove(board, "black");

    expect(move).not.toBeNull();
    expect(getLegalMoves(board, "black")).toContain(move);
  });

  it("returns null when there are no legal endgame moves", () => {
    const board = createBoardFixture({}, "black");

    expect(choosePerfectEndgameMove(board, "white")).toBeNull();
  });

  it("reads a one-move endgame exactly", () => {
    const board = createBoardFixture({ 0: null, 7: "white" }, "black");

    expect(choosePerfectEndgameMove(board, "white")).toBe(0);
  });

  it("returns exact endgame scores for legal moves", () => {
    const board = createBoardFixture({ 0: null, 7: "white" }, "black");

    expect(getPerfectEndgameMoveScores(board, "white")).toEqual([
      { move: 0, score: -48 },
    ]);
  });
});
