import { describe, expect, it } from "vitest";
import type { CoachHint } from "../teacher";
import {
  getSessionLegalMoves,
  startNewGame,
  type GameSession,
  type MoveRecord,
} from "../game/session";
import { shouldContinuePollingForBestMoveHint } from "./playCoachHintPolling";

describe("use play coach hint model helpers", () => {
  it("keeps polling when best-move hints are available but not visible yet", () => {
    expect(
      shouldContinuePollingForBestMoveHint({
        hints: [
          createHint({
            kind: "mobilityRisk",
            severity: "medium",
            square: 11,
          }),
        ],
        session: withPlayedMoveCount(startNewGame(), 6),
      }),
    ).toBe(true);
  });

  it("stops polling once the best-move hint is visible", () => {
    expect(
      shouldContinuePollingForBestMoveHint({
        hints: [
          createHint({
            kind: "bestMove",
            severity: "medium",
            square: 26,
          }),
        ],
        session: withPlayedMoveCount(startNewGame(), 6),
      }),
    ).toBe(false);
  });

  it("does not wait for best-move hints during the caution-only warmup", () => {
    expect(
      shouldContinuePollingForBestMoveHint({
        hints: [
          createHint({
            kind: "cornerRisk",
            severity: "high",
            square: 9,
          }),
        ],
        session: withPlayedMoveCount(startNewGame(), 4),
      }),
    ).toBe(false);
  });
});

function createHint({
  kind,
  severity,
  square,
}: Pick<CoachHint, "kind" | "severity" | "square">): CoachHint {
  return {
    candidate: null,
    kind,
    message: "",
    reasons: [],
    severity,
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
