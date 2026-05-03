import { describe, expect, it } from "vitest";
import type { Board } from "../../game/othello";
import { createBoardFixture } from "../../test/boardFixtures";
import { chooseOnePlyMove } from "./onePlyStrategy";

describe("one-ply CPU", () => {
  it("chooses the move with the highest evaluated resulting board", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[1] = "white";
    board[2] = "black";
    board[8] = "white";
    board[16] = "black";
    board[19] = "white";
    board[20] = "black";

    expect(chooseOnePlyMove(board, "black")).toBe(0);
  });

  it("keeps the first move when evaluated scores are tied", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[28] = "black";
    board[35] = "black";
    board[27] = "white";
    board[36] = "white";

    expect(chooseOnePlyMove(board, "black")).toBe(19);
  });

  it("returns null when there are no legal moves", () => {
    const board = createBoardFixture({}, "black");

    expect(chooseOnePlyMove(board, "white")).toBeNull();
  });
});
