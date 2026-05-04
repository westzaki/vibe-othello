import { describe, expect, it } from "vitest";
import { createMatchPlayerSettings } from "../game/matchSetup";
import type { PlayerSettings } from "../game/players";
import {
  endGame,
  startNewGame,
  startPracticeSession,
  type GameSession,
} from "../game/session";
import { createBoardFixture } from "../test/boardFixtures";
import {
  canShowCoachHint,
  createCoachHintModel,
  defaultCoachHintSettings,
} from "./coachHintModel";

describe("teacher coach hint model", () => {
  it("allows hints for a one-player human turn", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        players,
        session,
        settings: defaultCoachHintSettings,
      }),
    ).toBe(true);
  });

  it("does not show hints when the mode is off", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        players,
        session,
        settings: { mode: "off" },
      }),
    ).toBe(false);
  });

  it("does not show hints during two-player games", () => {
    const session = startNewGame();

    expect(
      canShowCoachHint({
        players: createMatchPlayerSettings("twoPlayer", "level1", "black"),
        session,
        settings: defaultCoachHintSettings,
      }),
    ).toBe(false);
  });

  it("does not show hints during CPU turns", () => {
    const session = startNewGame();

    expect(
      canShowCoachHint({
        players: createOnePlayerSettings("white"),
        session,
        settings: defaultCoachHintSettings,
      }),
    ).toBe(false);
  });

  it("does not show hints when CPU thinking is active", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        isCpuThinking: true,
        players,
        session,
        settings: defaultCoachHintSettings,
      }),
    ).toBe(false);
  });

  it("does not show hints outside a playing session", () => {
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        players,
        session: endGame(startNewGame()),
        settings: defaultCoachHintSettings,
      }),
    ).toBe(false);
  });

  it("creates a gentle model for high-priority hints", () => {
    const session = createPracticeSessionFromBoard(
      createBoardFixture({
        1: "white",
        2: "black",
      }),
      "black",
    );
    const model = createCoachHintModel({
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "gentle" },
    });

    expect(model).toEqual(
      expect.objectContaining({
        mode: "gentle",
        hint: expect.objectContaining({
          kind: "cornerOpportunity",
          square: 0,
        }),
      }),
    );
  });

  it("hides mobility-only hints in gentle mode", () => {
    const session = createPracticeSessionFromBoard(createMobilityBoard(), "black");

    expect(
      createCoachHintModel({
        players: createOnePlayerSettings("black"),
        session,
        settings: { mode: "gentle" },
      }),
    ).toBeNull();
  });

  it("includes mobility hints in active mode", () => {
    const session = createPracticeSessionFromBoard(createMobilityBoard(), "black");
    const model = createCoachHintModel({
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "active" },
    });

    expect(model).toEqual(
      expect.objectContaining({
        mode: "active",
        hint: expect.objectContaining({
          kind: "mobility",
          square: 26,
        }),
      }),
    );
  });
});

function createOnePlayerSettings(humanDisc: "black" | "white"): PlayerSettings {
  return createMatchPlayerSettings("onePlayer", "level1", humanDisc);
}

function createPracticeSessionFromBoard(
  board: GameSession["board"],
  nextDisc: GameSession["currentDisc"],
): GameSession {
  return startPracticeSession({
    board,
    lastMove: null,
    nextDisc,
  });
}

function createMobilityBoard(): GameSession["board"] {
  return createBoardFixture({
    18: "white",
    19: "black",
    27: "white",
    28: "black",
    35: "black",
    36: "white",
  });
}
