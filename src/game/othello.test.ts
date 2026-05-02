import { describe, expect, it } from "vitest";
import {
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  getWinner,
  isGameOver,
  placeDisc,
  type Board,
} from "./othello";

describe("Othello rules", () => {
  it("creates the standard initial board", () => {
    const board = createInitialBoard();

    expect(board).toHaveLength(64);
    expect(board[27]).toBe("white");
    expect(board[28]).toBe("black");
    expect(board[35]).toBe("black");
    expect(board[36]).toBe("white");
  });

  it("finds black legal moves on the initial board", () => {
    const board = createInitialBoard();

    expect(getLegalMoves(board, "black")).toEqual([19, 26, 37, 44]);
  });

  it("finds white legal moves on the initial board", () => {
    const board = createInitialBoard();

    expect(getLegalMoves(board, "white")).toEqual([20, 29, 34, 43]);
  });

  it("places a disc and flips bracketed opponent discs", () => {
    const board = createInitialBoard();
    const nextBoard = placeDisc(board, 19, "black");

    expect(nextBoard).not.toBe(board);
    expect(nextBoard[19]).toBe("black");
    expect(nextBoard[27]).toBe("black");
  });

  it("returns the same board when the move is not legal", () => {
    const board = createInitialBoard();

    expect(placeDisc(board, 0, "black")).toBe(board);
  });

  it("flips discs in multiple directions", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[19] = "black";
    board[27] = "white";
    board[34] = "black";
    board[35] = "white";
    board[36] = "white";
    board[37] = "black";

    const nextBoard = placeDisc(board, 43, "black");

    expect(nextBoard[27]).toBe("black");
    expect(nextBoard[35]).toBe("black");
    expect(nextBoard[43]).toBe("black");
  });

  it("counts black and white discs", () => {
    const board = createInitialBoard();

    expect(countDiscs(board)).toEqual({ black: 2, white: 2 });
  });

  it("detects game over when neither player has a legal move", () => {
    const board: Board = Array.from({ length: 64 }, () => "black");

    expect(isGameOver(board)).toBe(true);
  });

  it("detects the winner from disc counts", () => {
    const board: Board = Array.from({ length: 64 }, () => "black");

    board[0] = "white";

    expect(getWinner(board)).toBe("black");
  });

  it("detects a draw from disc counts", () => {
    const board: Board = Array.from({ length: 64 }, (_, index) =>
      index < 32 ? "black" : "white",
    );

    expect(getWinner(board)).toBe("draw");
  });
});
