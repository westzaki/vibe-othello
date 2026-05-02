import { describe, expect, it } from "vitest";
import type { Board } from "../game/othello";
import { createBoardFixture } from "../test/boardFixtures";
import { chooseMinimaxMove } from "./minimaxCpu";

describe("minimax CPU", () => {
  it("chooses the highest evaluated move when search depth is one", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[1] = "white";
    board[2] = "black";
    board[8] = "white";
    board[16] = "black";
    board[19] = "white";
    board[20] = "black";

    expect(chooseMinimaxMove(board, "black", 1)).toBe(0);
  });

  it("can choose a different move than one-ply evaluation after reading the opponent reply", () => {
    const board: Board = [
      "white",
      "white",
      "black",
      "white",
      null,
      null,
      "white",
      null,
      "white",
      null,
      null,
      "white",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "white",
      null,
      "white",
      null,
      "black",
      "white",
      null,
      "black",
      null,
      null,
      "white",
      "black",
      "white",
      "white",
      null,
      null,
      null,
      "white",
      "white",
      "white",
      "black",
      "black",
      "black",
      "white",
      null,
      null,
      null,
      null,
      "white",
      "white",
      "white",
      "white",
      "white",
      "white",
      "black",
      "white",
      "black",
      null,
      "white",
      "white",
      null,
      null,
      "white",
      "white",
    ];

    expect(chooseMinimaxMove(board, "black", 1)).toBe(47);
    expect(chooseMinimaxMove(board, "black", 2)).toBe(45);
  });

  it("returns null when there are no legal moves", () => {
    const board = createBoardFixture({}, "black");

    expect(chooseMinimaxMove(board, "white")).toBeNull();
  });
});
