import { describe, expect, it } from "vitest";
import type { Board } from "../game/othello";
import { createBoardFixture } from "../test/boardFixtures";
import { chooseCornerMove } from "./cornerCpu";

describe("corner CPU", () => {
  it("chooses a corner when one is legal", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[1] = "white";
    board[2] = "black";
    board[8] = "white";
    board[16] = "black";

    expect(chooseCornerMove(board, "black", () => 0.999)).toBe(0);
  });

  it("chooses the first corner when multiple corners are legal", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[1] = "white";
    board[2] = "black";
    board[6] = "white";
    board[5] = "black";

    expect(chooseCornerMove(board, "black", () => 0.999)).toBe(0);
  });

  it("falls back to a random legal move when no corner is legal", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[28] = "black";
    board[35] = "black";
    board[27] = "white";
    board[36] = "white";

    expect(chooseCornerMove(board, "black", () => 0)).toBe(19);
    expect(chooseCornerMove(board, "black", () => 0.999)).toBe(44);
  });

  it("returns null when there are no legal moves", () => {
    const board = createBoardFixture({}, "black");

    expect(chooseCornerMove(board, "white")).toBeNull();
  });
});
