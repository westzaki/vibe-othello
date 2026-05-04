import { describe, expect, it } from "vitest";
import { createInitialBoard } from "../../game/othello";
import { createBoardFixture } from "../../test/boardFixtures";
import { calculateAdvantage } from "./advantage";

describe("advantage calculation", () => {
  it("starts from an even position", () => {
    expect(calculateAdvantage(createInitialBoard())).toEqual({
      blackPercent: 50,
      leadingDisc: null,
      whitePercent: 50,
    });
  });

  it("leans toward the strategically stronger side", () => {
    const board = createBoardFixture({
      18: "white",
      19: "black",
      20: "white",
      27: "black",
      28: "black",
      35: "white",
      36: "black",
    });

    expect(calculateAdvantage(board).blackPercent).toBeGreaterThan(50);
  });

  it("shows a completed win as fully decided", () => {
    const board = createBoardFixture({ 0: "white" }, "black");

    expect(calculateAdvantage(board)).toEqual({
      blackPercent: 100,
      leadingDisc: "black",
      whitePercent: 0,
    });
  });

  it("uses exact reading near the end instead of strategic board weights", () => {
    const board = createBoardFixture({ 0: null, 7: "white" }, "black");

    expect(calculateAdvantage(board, "white")).toEqual({
      blackPercent: 100,
      leadingDisc: "black",
      whitePercent: 0,
    });
  });
});
