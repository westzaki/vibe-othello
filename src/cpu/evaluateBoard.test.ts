import { describe, expect, it } from "vitest";
import type { Board } from "../game/othello";
import { evaluateBoard } from "./evaluateBoard";

describe("board evaluation", () => {
  it("scores disc advantage for the current disc", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[10] = "black";
    board[11] = "black";
    board[12] = "white";

    expect(evaluateBoard(board, "black")).toBe(1);
    expect(evaluateBoard(board, "white")).toBe(-1);
  });

  it("weights corners more heavily than ordinary discs", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[0] = "black";
    board[10] = "white";
    board[11] = "white";
    board[12] = "white";

    expect(evaluateBoard(board, "black")).toBeGreaterThan(0);
  });

  it("slightly rewards having more legal moves than the opponent", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[18] = "white";
    board[19] = "black";
    board[20] = "white";
    board[27] = "black";
    board[28] = "black";
    board[35] = "white";
    board[36] = "black";

    expect(evaluateBoard(board, "black")).toBeGreaterThan(1);
  });
});
