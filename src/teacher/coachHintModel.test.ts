import { describe, expect, it } from "vitest";
import type { Advantage } from "../cpu";
import { createInitialBoard } from "../game/othello";
import { createMatchPlayerSettings } from "../game/matchSetup";
import type { PlayerSettings } from "../game/players";
import {
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  startPracticeSession,
  type GameSession,
  type MoveRecord,
} from "../game/session";
import { createBoardFixture } from "../test/boardFixtures";
import {
  canRequestCoachAnalysis,
  canRequestCoachBestMoveAnalysis,
  canShowCoachHint,
  createCoachPlayPositionAnalysisOptions,
  createCoachHintModel,
  defaultCoachHintSettings,
  getCoachHintDelayMs,
} from "./coachHintModel";
import { createPlayPositionAnalysis } from "./createPlayPositionAnalysis";

describe("teacher coach hint model", () => {
  it("uses auto teacher guidance for play hint analysis", () => {
    expect(
      createCoachPlayPositionAnalysisOptions("active", {
        includeBestMoveHint: true,
      }),
    ).toEqual(
      expect.objectContaining({
        guidanceMode: "auto",
        messageStyle: "direct",
        skipMoveAnalysis: false,
        useTeacherGuidanceMove: true,
      }),
    );
  });

  it("keeps gentle hint messages vague", () => {
    expect(createCoachPlayPositionAnalysisOptions("gentle")).toEqual(
      expect.objectContaining({
        messageStyle: "vague",
      }),
    );
  });

  it("uses lightweight analysis options when coach hints are off", () => {
    expect(createCoachPlayPositionAnalysisOptions("off")).toEqual(
      expect.objectContaining({
        skipMoveAnalysis: true,
        useTeacherGuidanceMove: false,
      }),
    );
  });

  it("exposes coach hint delays for deferred heavy guidance analysis", () => {
    expect(getCoachHintDelayMs("active")).toBe(1500);
    expect(getCoachHintDelayMs("gentle")).toBe(4500);
    expect(getCoachHintDelayMs("off")).toBeNull();
  });

  it("requests best-move analysis only after the hint can actually trigger", () => {
    const session = withPlayedMoveCount(startNewGame(), 6);
    const players = createOnePlayerSettings("black");

    expect(
      canRequestCoachBestMoveAnalysis({
        advantage: createAdvantage({ blackPercent: 50 }),
        players,
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 1499,
      }),
    ).toBe(false);
    expect(
      canRequestCoachBestMoveAnalysis({
        advantage: createAdvantage({ blackPercent: 50 }),
        players,
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 1500,
      }),
    ).toBe(true);
  });

  it("can request caution analysis before best-move hints are available", () => {
    const session = withPlayedMoveCount(startNewGame(), 4);
    const players = createOnePlayerSettings("black");

    expect(
      canRequestCoachAnalysis({
        advantage: createAdvantage({ blackPercent: 50 }),
        players,
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 1500,
      }),
    ).toBe(true);
    expect(
      canRequestCoachBestMoveAnalysis({
        advantage: createAdvantage({ blackPercent: 50 }),
        players,
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 1500,
      }),
    ).toBe(false);
  });

  it("does not request gentle best-move analysis unless the player is behind", () => {
    const session = withPlayedMoveCount(startNewGame(), 6);
    const players = createOnePlayerSettings("black");

    expect(
      canRequestCoachBestMoveAnalysis({
        advantage: createAdvantage({ blackPercent: 50 }),
        players,
        session,
        settings: { mode: "gentle" },
        thinkingTimeMs: 4500,
      }),
    ).toBe(false);
    expect(
      canRequestCoachBestMoveAnalysis({
        advantage: createAdvantage({ blackPercent: 40 }),
        players,
        session,
        settings: { mode: "gentle" },
        thinkingTimeMs: 4500,
      }),
    ).toBe(true);
  });

  it("allows gentle hints after a long pause in a difficult position", () => {
    const session = playFirstLegalMoves(4);
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
    const session = playFirstLegalMoves(4);
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
    const session = playFirstLegalMoves(4);
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
    const session = playFirstLegalMoves(4);
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
    const session = playFirstLegalMoves(4);
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
    const session = playFirstLegalMoves(4);

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
    const session = playFirstLegalMoves(4);
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

  it("waits for teacher guidance before showing play hints", () => {
    const session = withPlayedMoveCount(startNewGame(), 6);
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 50 }),
      analysis: createPlayPositionAnalysis(session.board, "black", {
        includeBestMoveHint: false,
        includeCandidateFallback: true,
        searchDepth: 1,
      }),
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "active" },
      thinkingTimeMs: 1500,
    });

    expect(model).toBeNull();
  });

  it("can show structured caution while waiting for the teacher best move", () => {
    const session = withPlayedMoveCount(
      createPracticeSessionFromBoard(createMobilityRiskBoard(), "white"),
      6,
    );
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 50 }),
      analysis: createPlayPositionAnalysis(session.board, "white", {
        includeBestMoveHint: false,
        includeCandidateFallback: true,
        searchDepth: 1,
      }),
      players: createOnePlayerSettings("white"),
      session,
      settings: { mode: "active" },
      thinkingTimeMs: 1500,
    });

    expect(model).toEqual(
      expect.objectContaining({
        mode: "active",
        hint: expect.objectContaining({
          kind: "mobilityRisk",
          square: 11,
        }),
      }),
    );
    expect(model?.hints).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "candidate",
        }),
      ]),
    );
    expect(model?.hints).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "bestMove",
        }),
      ]),
    );
  });

  it("does not show hints during the opening warmup", () => {
    const session = startNewGame();

    expect(
      canShowCoachHint({
        advantage: createAdvantage({ blackPercent: 30 }),
        players: createOnePlayerSettings("black"),
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 5000,
      }),
    ).toBe(false);
    expect(
      createCoachHintModel({
        advantage: createAdvantage({ blackPercent: 30 }),
        players: createOnePlayerSettings("black"),
        session,
        settings: { mode: "active" },
        thinkingTimeMs: 5000,
      }),
    ).toBeNull();
  });

  it("can show caution hints after warmup before best-move hints start", () => {
    const session = withPlayedMoveCount(
      createPracticeSessionFromBoard(createMobilityRiskBoard(), "white"),
      4,
    );
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 50 }),
      players: createOnePlayerSettings("white"),
      session,
      settings: { mode: "active" },
      thinkingTimeMs: 1500,
    });

    expect(model).toEqual(
      expect.objectContaining({
        mode: "active",
        hint: expect.objectContaining({
          kind: "mobilityRisk",
          square: 11,
        }),
      }),
    );
    expect(model?.hints).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "bestMove",
        }),
      ]),
    );
  });

  it("creates a vague gentle model after a long pause in a difficult position", () => {
    const session = withPlayedMoveCount(
      createPracticeSessionFromBoard(
        createBoardFixture({
          1: "white",
          2: "black",
        }),
        "black",
      ),
      6,
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
          kind: "bestMove",
          square: 0,
        }),
      }),
    );
    expect(model?.hint.message).not.toContain("A1");
  });

  it("includes mobility hints in gentle mode when timing and advantage allow it", () => {
    const session = withPlayedMoveCount(
      createPracticeSessionFromBoard(createMobilityBoard(), "black"),
      6,
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
          kind: "bestMove",
          square: 26,
        }),
      }),
    );
    expect(model?.hint.message).not.toContain("C4");
  });

  it("includes mobility risk hints as caution in active mode", () => {
    const session = withPlayedMoveCount(
      createPracticeSessionFromBoard(createMobilityRiskBoard(), "white"),
      6,
    );
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 50 }),
      players: createOnePlayerSettings("white"),
      session,
      settings: { mode: "active" },
      thinkingTimeMs: 1500,
    });

    expect(model).toEqual(
      expect.objectContaining({
        mode: "active",
        hint: expect.objectContaining({
          kind: "bestMove",
          square: expect.any(Number),
        }),
      }),
    );
    expect(model?.hint.message).toContain("本命");
    expect(model?.hints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "mobilityRisk",
          square: 11,
        }),
      ]),
    );
  });

  it("creates a specific active model after a shorter pause", () => {
    const session = withPlayedMoveCount(
      createPracticeSessionFromBoard(createMobilityBoard(), "black"),
      6,
    );
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
          kind: "bestMove",
          square: 26,
        }),
      }),
    );
    expect(model?.hint.message).toContain("C4");
  });

  it("uses a candidate fallback in active mode when no specific hint is found", () => {
    const session = withPlayedMoveCount(
      createPracticeSessionFromBoard(createInitialBoard(), "black"),
      6,
    );
    const model = createCoachHintModel({
      advantage: createAdvantage({ blackPercent: 70 }),
      players: createOnePlayerSettings("black"),
      session,
      settings: { mode: "active" },
      thinkingTimeMs: 1500,
    });

    expect(model).toEqual(
      expect.objectContaining({
        analysis: expect.objectContaining({
          phase: "opening",
          moveEvaluationSource: "search",
        }),
        mode: "active",
        hint: expect.objectContaining({
          kind: "bestMove",
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

function playFirstLegalMoves(moveCount: number): GameSession {
  let session = startNewGame();

  for (let moveIndex = 0; moveIndex < moveCount; moveIndex += 1) {
    const nextMove = getSessionLegalMoves(session)[0];

    if (nextMove === undefined) {
      return session;
    }

    session = placeCurrentDisc(session, nextMove).session;
  }

  return session;
}

function withPlayedMoveCount(
  session: GameSession,
  moveCount: number,
): GameSession {
  return {
    ...session,
    moveHistory: Array.from({ length: moveCount }, (_, index) =>
      createMoveRecord(session, index + 1),
    ),
  };
}

function createMoveRecord(
  session: GameSession,
  moveNumber: number,
): MoveRecord {
  return {
    boardAfter: session.board,
    boardBefore: session.board,
    disc: session.currentDisc,
    flippedSquares: [],
    legalMovesBefore: getSessionLegalMoves(session),
    moveNumber,
    square: getSessionLegalMoves(session)[0] ?? 0,
  };
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

function createMobilityRiskBoard(): GameSession["board"] {
  return createBoardFixture({
    1: "black",
    9: "black",
    17: "black",
    18: "white",
    19: "black",
    27: "white",
    28: "black",
    35: "black",
    36: "white",
  });
}
