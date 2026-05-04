import { describe, expect, it } from "vitest";
import type { PlayerSettings } from "../game/players";
import { getResultTitle, getResultTone } from "./resultLabels";

describe("getResultTitle", () => {
  it("shows the result from the human player's perspective in 1P mode", () => {
    const humanBlack = createOnePlayerSettings("black");
    const humanWhite = createOnePlayerSettings("white");

    expect(getResultTitle("black", humanBlack)).toBe("あなたの勝ち");
    expect(getResultTitle("white", humanBlack)).toBe("あなたの負け");
    expect(getResultTitle("white", humanWhite)).toBe("あなたの勝ち");
    expect(getResultTitle("black", humanWhite)).toBe("あなたの負け");
  });

  it("shows draw text in 1P mode", () => {
    expect(getResultTitle("draw", createOnePlayerSettings("black"))).toBe(
      "引き分け",
    );
  });

  it("shows the winning disc color in 2P mode", () => {
    const players = createTwoPlayerSettings();

    expect(getResultTitle("black", players)).toBe("黒の勝ち");
    expect(getResultTitle("white", players)).toBe("白の勝ち");
    expect(getResultTitle("draw", players)).toBe("引き分け");
  });
});

describe("getResultTone", () => {
  it("uses human win/loss tones in 1P mode", () => {
    const humanBlack = createOnePlayerSettings("black");

    expect(getResultTone("black", humanBlack)).toBe("human-win");
    expect(getResultTone("white", humanBlack)).toBe("human-loss");
    expect(getResultTone("draw", humanBlack)).toBe("draw");
  });

  it("uses disc winner tones in 2P mode", () => {
    const players = createTwoPlayerSettings();

    expect(getResultTone("black", players)).toBe("black-win");
    expect(getResultTone("white", players)).toBe("white-win");
    expect(getResultTone("draw", players)).toBe("draw");
  });
});

function createOnePlayerSettings(humanDisc: "black" | "white"): PlayerSettings {
  return {
    black: {
      cpuLevel: "level1",
      type: humanDisc === "black" ? "human" : "cpu",
    },
    white: {
      cpuLevel: "level1",
      type: humanDisc === "white" ? "human" : "cpu",
    },
  };
}

function createTwoPlayerSettings(): PlayerSettings {
  return {
    black: {
      cpuLevel: "level1",
      type: "human",
    },
    white: {
      cpuLevel: "level1",
      type: "human",
    },
  };
}
