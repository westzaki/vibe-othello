import { describe, expect, it } from "vitest";
import type { PlayerSettings } from "../../game/players";
import { getReviewedDisc, getReviewOutcome } from "./reviewPlayers";

describe("getReviewedDisc", () => {
  it("keeps two-player matches outside review for now", () => {
    expect(getReviewedDisc(createTwoPlayerSettings())).toBeNull();
  });
});

describe("getReviewOutcome", () => {
  it("returns win when the reviewed disc is the winner", () => {
    expect(getReviewOutcome("black", "black")).toBe("win");
    expect(getReviewOutcome("white", "white")).toBe("win");
  });

  it("returns loss when the reviewed disc is not the winner", () => {
    expect(getReviewOutcome("black", "white")).toBe("loss");
    expect(getReviewOutcome("white", "black")).toBe("loss");
  });

  it("returns draw when the game is tied", () => {
    expect(getReviewOutcome("black", "draw")).toBe("draw");
  });

  it("returns null when there is no reviewed disc", () => {
    expect(getReviewOutcome(null, "black")).toBeNull();
  });
});

function createTwoPlayerSettings(): PlayerSettings {
  return {
    black: createPlayer("human"),
    white: createPlayer("human"),
  };
}

function createPlayer(type: "human" | "cpu") {
  return {
    cpuLevel: "level1" as const,
    type,
  };
}
