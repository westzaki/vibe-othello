import { describe, expect, it } from "vitest";
import type { CoachHint } from "./createCoachHint";
import type { CoachHintModel } from "./coachHintModel";
import { createCoachHintDebugSnapshot } from "./coachHintDiagnostics";
import { createPlayPositionAnalysis } from "./createPlayPositionAnalysis";
import { createMatchPlayerSettings } from "../game/matchSetup";
import {
  getSessionLegalMoves,
  startNewGame,
  type GameSession,
  type MoveRecord,
} from "../game/session";

describe("coach hint diagnostics", () => {
  it("reports opening warmup before hint analysis can start", () => {
    const session = startNewGame();
    const snapshot = createCoachHintDebugSnapshot({
      analysis: createPlayPositionAnalysis(session.board, session.currentDisc, {
        skipMoveAnalysis: true,
      }),
      analysisStatus: "sync",
      canRequestAnalysisAtDelay: false,
      enabled: true,
      isAnalysisRequested: false,
      isCpuThinking: false,
      model: null,
      players: createOnePlayerSettings(),
      session,
      settings: { mode: "active" },
    });

    expect(snapshot.reason).toBe("openingWarmup");
  });

  it("reports worker loading after coach analysis is requested", () => {
    const session = withPlayedMoveCount(startNewGame(), 6);
    const snapshot = createCoachHintDebugSnapshot({
      analysis: createPlayPositionAnalysis(session.board, session.currentDisc, {
        skipMoveAnalysis: true,
      }),
      analysisStatus: "loading",
      canRequestAnalysisAtDelay: true,
      enabled: true,
      isAnalysisRequested: true,
      isCpuThinking: false,
      model: null,
      players: createOnePlayerSettings(),
      session,
      settings: { mode: "active" },
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        analysisStatus: "loading",
        reason: "analysisLoading",
      }),
    );
  });

  it("reports lightweight fallback after a worker failure or timeout", () => {
    const session = withPlayedMoveCount(startNewGame(), 6);
    const snapshot = createCoachHintDebugSnapshot({
      analysis: createPlayPositionAnalysis(session.board, session.currentDisc, {
        skipMoveAnalysis: true,
      }),
      analysisStatus: "fallback",
      canRequestAnalysisAtDelay: true,
      enabled: true,
      isAnalysisRequested: true,
      isCpuThinking: false,
      model: null,
      players: createOnePlayerSettings(),
      session,
      settings: { mode: "active" },
    });

    expect(snapshot.reason).toBe("analysisFallback");
  });

  it("reports visible hints with their kinds", () => {
    const session = withPlayedMoveCount(startNewGame(), 6);
    const analysis = createPlayPositionAnalysis(session.board, session.currentDisc, {
      skipMoveAnalysis: true,
    });
    const hint = createHint({ kind: "bestMove", square: 26 });
    const model: CoachHintModel = {
      analysis,
      hint,
      hints: [hint],
      mode: "active",
    };
    const snapshot = createCoachHintDebugSnapshot({
      analysis,
      analysisStatus: "ready",
      canRequestAnalysisAtDelay: true,
      enabled: true,
      isAnalysisRequested: true,
      isCpuThinking: false,
      model,
      players: createOnePlayerSettings(),
      session,
      settings: { mode: "active" },
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        reason: "ready",
        visibleHintKinds: ["bestMove"],
      }),
    );
  });
});

function createOnePlayerSettings() {
  return createMatchPlayerSettings("onePlayer", "level1", "black");
}

function createHint({
  kind,
  square,
}: Pick<CoachHint, "kind" | "square">): CoachHint {
  return {
    candidate: null,
    kind,
    message: "",
    reasons: [],
    severity: "medium",
    square,
  };
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
