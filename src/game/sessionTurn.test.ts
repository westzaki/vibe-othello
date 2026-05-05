import { describe, expect, it } from "vitest";
import { createInitialBoard } from "./othello";
import { createBoardFixture } from "../test/boardFixtures";
import { createPassNotice, resolvePlayableTurn } from "./sessionTurn";

describe("session turn resolution", () => {
  it("keeps the preferred disc when it has a legal move", () => {
    expect(resolvePlayableTurn(createInitialBoard(), "black")).toEqual({
      currentDisc: "black",
      notice: null,
    });
  });

  it("passes to the fallback disc when the preferred disc cannot move", () => {
    const board = createBoardFixture(
      {
        4: "white",
        5: null,
      },
      "black",
    );

    expect(resolvePlayableTurn(board, "white", "black")).toEqual({
      currentDisc: "black",
      notice: {
        nextDisc: "black",
        skippedDisc: "white",
        type: "pass",
      },
    });
  });

  it("creates typed pass notices", () => {
    expect(createPassNotice("white", "black")).toEqual({
      nextDisc: "black",
      skippedDisc: "white",
      type: "pass",
    });
  });
});
