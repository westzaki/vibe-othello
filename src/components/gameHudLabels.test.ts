import { describe, expect, it } from "vitest";
import type { PlayerSettings } from "../game/players";
import { getAdvantageLabel, getTurnLabel } from "./gameHudLabels";

describe("getTurnLabel", () => {
  it("uses player perspective labels in 1P mode", () => {
    const players = createOnePlayerSettings("black");

    expect(getTurnLabel("black", false, players)).toBe("あなたの番");
    expect(getTurnLabel("white", false, players)).toBe("CPUの番");
    expect(getTurnLabel("white", true, players)).toBe("CPUが考え中");
  });

  it("uses disc labels in 2P mode", () => {
    const players = createTwoPlayerSettings();

    expect(getTurnLabel("black", false, players)).toBe("黒の番");
    expect(getTurnLabel("white", true, players)).toBe("白の番");
  });
});

describe("getAdvantageLabel", () => {
  it("keeps tiny evaluation differences as an even game", () => {
    const players = createOnePlayerSettings("black");

    expect(
      getAdvantageLabel(
        { blackPercent: 53, leadingDisc: "black", whitePercent: 47 },
        players,
      ),
    ).toBe("いい勝負");
  });

  it("uses player perspective labels in 1P mode", () => {
    const players = createOnePlayerSettings("white");

    expect(
      getAdvantageLabel(
        { blackPercent: 60, leadingDisc: "black", whitePercent: 40 },
        players,
      ),
    ).toBe("CPUが少しリード");
    expect(
      getAdvantageLabel(
        { blackPercent: 40, leadingDisc: "white", whitePercent: 60 },
        players,
      ),
    ).toBe("あなたが少しリード");
  });

  it("uses disc labels in 2P mode", () => {
    const players = createTwoPlayerSettings();

    expect(
      getAdvantageLabel(
        { blackPercent: 60, leadingDisc: "black", whitePercent: 40 },
        players,
      ),
    ).toBe("黒が少しリード");
    expect(
      getAdvantageLabel(
        { blackPercent: 50, leadingDisc: null, whitePercent: 50 },
        players,
      ),
    ).toBe("いい勝負");
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
