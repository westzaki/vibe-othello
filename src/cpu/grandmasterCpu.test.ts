import { describe, expect, it } from "vitest";
import { createInitialBoard } from "../game/othello";
import { createBoardFixture } from "../test/boardFixtures";
import { chooseGrandmasterMove, choosePerfectEndgameMove } from "./grandmasterCpu";
import { chooseMinimaxMove } from "./minimaxCpu";

describe("grandmaster CPU", () => {
  it("uses the level 5 minimax search before the endgame", () => {
    const board = createInitialBoard();

    expect(chooseGrandmasterMove(board, "black")).toBe(
      chooseMinimaxMove(board, "black"),
    );
  });

  it("returns null when there are no legal endgame moves", () => {
    const board = createBoardFixture({}, "black");

    expect(choosePerfectEndgameMove(board, "white")).toBeNull();
  });

  it("reads a one-move endgame exactly", () => {
    const board = createBoardFixture({ 0: null, 7: "white" }, "black");

    expect(choosePerfectEndgameMove(board, "white")).toBe(0);
  });
});
