import { describe, expect, it } from "vitest";
import { createInitialBoard, type Board } from "../game/othello";
import { chooseRandomMove } from "./randomCpu";

describe("random CPU", () => {
  it("chooses a legal move from the current board", () => {
    const board = createInitialBoard();

    expect(chooseRandomMove(board, "black", () => 0)).toBe(19);
    expect(chooseRandomMove(board, "black", () => 0.5)).toBe(37);
    expect(chooseRandomMove(board, "black", () => 0.999)).toBe(44);
  });

  it("returns null when there are no legal moves", () => {
    const board: Board = Array.from({ length: 64 }, () => "black");

    expect(chooseRandomMove(board, "white")).toBeNull();
  });
});
