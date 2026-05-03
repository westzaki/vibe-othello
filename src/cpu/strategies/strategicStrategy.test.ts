import { describe, expect, it } from "vitest";
import type { Board } from "../../game/othello";
import { createBoardFixture } from "../../test/boardFixtures";
import { chooseStrategicMove } from "./strategicStrategy";

describe("strategic CPU", () => {
  it("chooses the legal move with the highest strategic evaluation", () => {
    const board: Board = Array.from({ length: 64 }, () => null);

    board[1] = "white";
    board[2] = "black";
    board[8] = "white";
    board[16] = "black";
    board[19] = "white";
    board[20] = "black";

    expect(chooseStrategicMove(board, "black")).toBe(0);
  });

  it("returns null when there are no legal moves", () => {
    const board = createBoardFixture({}, "black");

    expect(chooseStrategicMove(board, "white")).toBeNull();
  });
});
