import { describe, expect, it } from "vitest";
import type { Board } from "../game/othello";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";

describe("strategic board evaluation", () => {
  it("values corners strongly", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[0] = "black";
    board[10] = "white";
    board[11] = "white";
    board[12] = "white";

    expect(strategicEvaluateBoard(board, "black")).toBeGreaterThan(0);
  });

  it("penalizes dangerous squares next to an empty corner", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[1] = "black";
    board[10] = "white";

    expect(strategicEvaluateBoard(board, "black")).toBeLessThan(0);
  });

  it("rewards having more legal moves than the opponent", () => {
    const mobileBoard: Board = Array.from({ length: 64 }, () => null);

    mobileBoard[18] = "white";
    mobileBoard[19] = "black";
    mobileBoard[20] = "white";
    mobileBoard[27] = "black";
    mobileBoard[28] = "black";
    mobileBoard[35] = "white";
    mobileBoard[36] = "black";

    expect(strategicEvaluateBoard(mobileBoard, "black")).toBeGreaterThan(0);
  });

  it("weights disc count more heavily near the endgame", () => {
    const board: Board = Array.from({ length: 64 }, (_, index) =>
      index % 2 === 0 ? "black" : "white",
    );

    board[27] = null;
    board[58] = null;
    board[59] = null;
    board[60] = null;
    board[61] = null;
    board[62] = null;
    board[63] = null;

    const beforeScore = strategicEvaluateBoard(board, "black");

    board[27] = "black";

    expect(
      strategicEvaluateBoard(board, "black") - beforeScore,
    ).toBeGreaterThan(3);
  });
});
