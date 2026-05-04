import { describe, expect, it } from "vitest";
import type { Advantage } from "../cpu";
import { createInitialBoard } from "../game/othello";
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
  it("allows gentle hints after a long pause in a difficult position", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 40 }),
        players,
        session,
        settings: defaultCoachHintSettings,
        thinkingTimeMs: 4500,
      }),
    ).toBe(true);
  });

  it("does not show gentle hints before the player has paused for a while", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 40 }),
        players,
        session,
        settings: { mode: "gentle" },
        thinkingTimeMs: 4400,
      }),
    ).toBe(false);
  });

  it("does not show gentle hints while the current player is ahead", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 55 }),
        players,
        session,
        settings: { mode: "gentle" },
        thinkingTimeMs: 4500,
      }),
    ).toBe(false);
  });

  it("allows active hints after a shorter pause regardless of advantage", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 70 }),
        players,
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 1500,
      }),
    ).toBe(true);
  });

  it("does not show active hints before the shorter pause", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 40 }),
        players,
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 1400,
      }),
    ).toBe(false);
  });

  it("does not show hints when the mode is off", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 40 }),
        players,
        session,
        settings: { mode: "off" },
        thinkingTimeMs: 4500,
      }),
    ).toBe(false);
  });

  it("does not show hints during two-player games", () => {
    const session = startNewGame();

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 40 }),
        players: createMatchPlayerSettings("twoPlayer", "level1", "black"),
        session,
        settings: defaultCoachHintSettings,
        thinkingTimeMs: 4500,
      }),
    ).toBe(false);
  });

  it("does not show hints during CPU turns", () => {
    const session = startNewGame();

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 60 }),
        players: createOnePlayerSettings("white"),
        session,
        settings: defaultCoachHintSettings,
        thinkingTimeMs: 4500,
      }),
    ).toBe(false);
  });

  it("does not show hints when CPU thinking is active", () => {
    const session = startNewGame();
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 40 }),
        isCpuThinking: true,
        players,
        session,
        settings: defaultCoachHintSettings,
        thinkingTimeMs: 4500,
      }),
    ).toBe(false);
  });

  it("does not show hints outside a playing session", () => {
    const players = createOnePlayerSettings("black");

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 40 }),
        players,
        session: endGame(startNewGame()),
        settings: defaultCoachHintSettings,
        thinkingTimeMs: 4500,
      }),
    ).toBe(false);
  });

  it("creates a vague gentle model after a long pause in a difficult position", () => {
    const session = createPracticeSessionFromBoard(
      createBoardFixture({
        1: "white",
        2: "black",
      }),
      "black",
    );
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 40 }),
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "gentle" },
      thinkingTimeMs: 4500,
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
    expect(model?.hint.message).not.toContain("A1");
  });

  it("includes mobility hints in gentle mode when timing and advantage allow it", () => {
    const session = createPracticeSessionFromBoard(createMobilityBoard(), "black");
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 40 }),
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "gentle" },
      thinkingTimeMs: 4500,
    });

    expect(model).toEqual(
      expect.objectContaining({
        mode: "gentle",
        hint: expect.objectContaining({
          kind: "mobility",
          square: 26,
        }),
      }),
    );
    expect(model?.hint.message).not.toContain("C4");
  });

  it("creates a specific active model after a shorter pause", () => {
    const session = createPracticeSessionFromBoard(createMobilityBoard(), "black");
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 70 }),
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "active" },
      thinkingTimeMs: 1500,
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
    expect(model?.hint.message).toContain("C4");
  });

  it("uses a candidate fallback in active mode when no specific hint is found", () => {
    const session = createPracticeSessionFromBoard(createInitialBoard(), "black");
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 70 }),
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "active" },
      thinkingTimeMs: 1500,
    });

    expect(model).toEqual(
      expect.objectContaining({
        mode: "active",
        hint: expect.objectContaining({
          kind: "candidate",
          square: expect.any(Number),
        }),
      }),
    );
  });
});

function createAdvantage({
  blackPercent,
}: {
  blackPercent: number;
}): Advantage {
  return {
    blackPercent,
    leadingDisc:
      blackPercent === 50 ? null : blackPercent > 50 ? "black" : "white",
    whitePercent: 100 - blackPercent,
  };
}

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
