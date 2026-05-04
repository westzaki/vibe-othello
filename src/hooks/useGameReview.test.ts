import { describe, expect, it } from "vitest";
import { createMatchPlayerSettings } from "../game/matchSetup";
import {
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  type GameSession,
} from "../game/session";
import { createGameReviewModel } from "../services/gameReviewModel";

describe("createGameReviewModel", () => {
  it("returns unavailable for two-player matches", () => {
    const session = playFirstLegalMoves(4);
    const model = createGameReviewModel({
      currentMoveNumber: 999,
      moveHistory: session.moveHistory,
      players: createMatchPlayerSettings("twoPlayer", "level1", "black"),
      winner: "draw",
    });

    expect(model.status).toBe("unavailable");
    expect(model.reviewedDisc).toBeNull();
    expect(model.safeMoveNumber).toBe(model.maxMoveNumber);
    expect(model.displayedMoveNumber).toBe(model.safeMoveNumber);
    expect(model.selectableMoves).toEqual([]);
  });

  it("builds a ready review model for one-player matches", () => {
    const session = playFirstLegalMoves(8);
    const model = createGameReviewModel({
      currentMoveNumber: 2,
      moveHistory: session.moveHistory,
      players: createMatchPlayerSettings("onePlayer", "level1", "black"),
      winner: "black",
    });

    expect(model.status).toBe("ready");

    if (model.status !== "ready") {
      return;
    }

    expect(model.reviewedDisc).toBe("black");
    expect(model.review.reviewedDisc).toBe("black");
    expect(model.messages.moveMessages).toBeInstanceOf(Map);
    expect(model.lesson.cards.length).toBeGreaterThan(0);
    expect(model.playbackBoards).toHaveLength(session.moveHistory.length + 1);
    expect(model.safeMoveNumber).toBe(2);
  });
});

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
