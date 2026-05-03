import { describe, expect, it } from "vitest";
import {
  createMatchPlayerSettings,
  getInitialGameMode,
  getInitialHumanDisc,
} from "./matchSetup";

describe("match setup", () => {
  it("creates two-player settings with both discs controlled by humans", () => {
    const players = createMatchPlayerSettings("twoPlayer", "level4", "white");

    expect(players).toEqual({
      black: {
        cpuLevel: "level4",
        type: "human",
      },
      white: {
        cpuLevel: "level4",
        type: "human",
      },
    });
  });

  it("assigns the opposite disc to CPU in one-player settings", () => {
    const players = createMatchPlayerSettings("onePlayer", "level3", "black");

    expect(players.black).toEqual({
      cpuLevel: "level3",
      type: "human",
    });
    expect(players.white).toEqual({
      cpuLevel: "level3",
      type: "cpu",
    });
  });

  it("derives start screen defaults from current player settings", () => {
    const players = createMatchPlayerSettings("onePlayer", "level2", "white");

    expect(getInitialGameMode(players)).toBe("onePlayer");
    expect(getInitialHumanDisc(players)).toBe("white");
  });
});
