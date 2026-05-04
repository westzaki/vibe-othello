import { describe, expect, it } from "vitest";
import { createBoardFixture } from "../test/boardFixtures";
import { createCoachHint } from "./createCoachHint";

describe("teacher coach hints", () => {
  it("returns null when there are no candidate moves", () => {
    const board = createBoardFixture({}, "black");

    expect(createCoachHint(board, "black")).toBeNull();
  });

  it("points out a corner opportunity without forcing a best-move tone", () => {
    const board = createBoardFixture({
      1: "white",
      2: "black",
    });
    const hint = createCoachHint(board, "black", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "cornerOpportunity",
        reasons: expect.arrayContaining(["corner"]),
        square: 0,
      }),
    );
    expect(hint?.message).toContain("角を取れる場所");
    expect(hint?.message).not.toContain("正解");
    expect(hint?.message).not.toContain("最善");
  });

  it("warns about candidate moves that may give the opponent a corner", () => {
    const board = createBoardFixture({
      10: "white",
      11: "black",
      18: "white",
      27: "white",
      28: "black",
    });
    const hint = createCoachHint(board, "black", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "cornerRisk",
        reasons: expect.arrayContaining(["cornerGiven"]),
        square: 9,
      }),
    );
    expect(hint?.message).toContain("角の近く");
  });

  it("uses mobility gain when no corner hint is more important", () => {
    const board = createBoardFixture({
      18: "white",
      19: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    });
    const hint = createCoachHint(board, "black", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "mobility",
        reasons: expect.arrayContaining(["mobilityGain"]),
        square: 26,
      }),
    );
    expect(hint?.message).toContain("動きづらく");
  });

  it("uses an endgame hint when the analysis is exact endgame", () => {
    const board = createBoardFromString(
      "wwwwb-b-wbbwbbwwwbwbbbbbwwwbbwbww-bwwbww-wwwbwb-bwwbbbw-ww-w--ww",
    );
    const hint = createCoachHint(board, "white", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "endgame",
        square: expect.any(Number),
      }),
    );
    expect(hint?.message).toContain("終盤");
  });
});

function createBoardFromString(source: string) {
  return Array.from(source, (cell) => {
    if (cell === "b") {
      return "black";
    }

    if (cell === "w") {
      return "white";
    }

    return null;
  });
}
