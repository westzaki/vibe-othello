import { describe, expect, it } from "vitest";
import { getLegalMoves, placeDisc } from "../../game/othello";
import { createBoardFixture } from "../../test/boardFixtures";
import {
  chooseExactEndgameMove,
  getExactEndgameMoveScores,
  solveExactEndgameDiscDifference,
} from "./exactEndgame";

describe("exact endgame search", () => {
  it("solves a one-move endgame from the current turn", () => {
    const board = createBoardFixture({ 0: null, 7: "white" }, "black");

    expect(solveExactEndgameDiscDifference(board, "white", "black")).toBe(48);
  });

  it("passes when the current player has no legal move", () => {
    const board = createBoardFixture({ 4: "white", 5: null }, "black");

    expect(solveExactEndgameDiscDifference(board, "white", "black")).toBe(64);
  });

  it("solves an endgame with more than one move remaining", () => {
    const board = createBoardFixture(
      {
        0: null,
        1: null,
        2: null,
        4: "white",
      },
      "black",
    );
    const afterWhiteMove = placeDisc(board, 2, "white");

    expect(getLegalMoves(board, "white")).toEqual([2]);
    expect(getLegalMoves(afterWhiteMove, "black")).toEqual([1]);
    expect(solveExactEndgameDiscDifference(board, "white", "black")).toBe(63);
  });

  it("chooses the highest scoring exact endgame move", () => {
    const board = createBoardFixture({ 0: null, 7: "white" }, "black");

    expect(chooseExactEndgameMove(board, "white")).toBe(0);
  });

  it("returns exact endgame move scores in descending order", () => {
    const board = createBoardFixture(
      {
        0: null,
        1: null,
        2: null,
        4: "white",
      },
      "black",
    );

    expect(getExactEndgameMoveScores(board, "white").map(({ move }) => move))
      .toEqual([2]);
  });
});
