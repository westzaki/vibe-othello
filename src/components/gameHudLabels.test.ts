import { describe, expect, it } from "vitest";
import type { PlayerSettings } from "../game/players";
import {
  getAdvantageContextLabel,
  getAdvantageLabel,
  getTurnLabel,
} from "./gameHudLabels";

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

describe("getAdvantageContextLabel", () => {
  it("uses exact endgame and final labels before shape signals", () => {
    expect(
      getAdvantageContextLabel({
        confidenceReason: "exactEndgame",
        shapeSignals: [
          {
            candidate: null,
            kind: "mobilityRisk",
            square: null,
            strength: "high",
            tone: "risk",
          },
        ],
      }),
    ).toBe("終盤読み");

    expect(
      getAdvantageContextLabel({
        confidenceReason: "finalBoard",
        shapeSignals: [],
      }),
    ).toBe("最終盤面");
  });

  it("selects a short label from the highest priority shape signal", () => {
    expect(
      getAdvantageContextLabel({
        confidenceReason: "searchCandidates",
        shapeSignals: [
          {
            candidate: null,
            kind: "mobilityOpportunity",
            square: 26,
            strength: "medium",
            tone: "helpful",
          },
          {
            candidate: null,
            kind: "cornerRisk",
            square: 9,
            strength: "high",
            tone: "risk",
          },
        ],
      }),
    ).toBe("角に注意");
  });

  it("falls back to a soft heuristic label when there are no signals", () => {
    expect(
      getAdvantageContextLabel({
        confidenceReason: "searchCandidates",
        shapeSignals: [],
      }),
    ).toBe("形から見た目安");
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
