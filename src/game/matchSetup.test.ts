import { describe, expect, it } from "vitest";
import { chooseCpuMove } from "../cpu";
import { getLegalMoves } from "./othello";
import { placeCurrentDisc, startNewGame } from "./session";
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

  it("lets CPU black make the opening move when the human chooses white", () => {
    const players = createMatchPlayerSettings("onePlayer", "level1", "white");
    const session = startNewGame();

    expect(players.black).toEqual({
      cpuLevel: "level1",
      type: "cpu",
    });
    expect(players.white).toEqual({
      cpuLevel: "level1",
      type: "human",
    });
    expect(session.currentDisc).toBe("black");

    const cpuMove = chooseCpuMove(
      session.board,
      session.currentDisc,
      players.black.cpuLevel,
    );

    expect(cpuMove).not.toBeNull();
    expect(getLegalMoves(session.board, "black")).toContain(cpuMove);

    const nextSession = placeCurrentDisc(session, cpuMove ?? -1).session;

    expect(nextSession.moveHistory).toHaveLength(1);
    expect(nextSession.moveHistory[0].disc).toBe("black");
    expect(nextSession.moveHistory[0].square).toBe(cpuMove);
    expect(nextSession.currentDisc).toBe("white");
  });
});
