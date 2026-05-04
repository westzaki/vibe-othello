import { describe, expect, it } from "vitest";
import { createDebugSession } from "../debug/debugFixtures";
import { createMatchPlayerSettings } from "../game/matchSetup";
import {
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  type GameSession,
} from "../game/session";
import {
  createErrorGameReviewModel,
  createGameReviewModel,
  createGameReviewModelFromReview,
  createLoadingGameReviewModel,
} from "../services/gameReviewModel";
import { reviewGame } from "../teacher";

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

  it("builds a loading model without requiring a completed review", () => {
    const session = playFirstLegalMoves(8);
    const model = createLoadingGameReviewModel({
      currentMoveNumber: 2,
      moveHistory: session.moveHistory,
      players: createMatchPlayerSettings("onePlayer", "level1", "black"),
      winner: "black",
    });

    expect(model.status).toBe("loading");
    expect(model.review).toBeNull();
    expect(model.lesson).toBeNull();
    expect(model.playbackBoards).toHaveLength(session.moveHistory.length + 1);
    expect(model.safeMoveNumber).toBe(2);
  });

  it("builds a ready model from an async review result", () => {
    const session = playFirstLegalMoves(8);
    const players = createMatchPlayerSettings("onePlayer", "level1", "black");
    const review = reviewGame(session.moveHistory, {
      reviewedDisc: "black",
      searchDepth: 1,
    });
    const model = createGameReviewModelFromReview({
      currentMoveNumber: 2,
      moveHistory: session.moveHistory,
      players,
      review,
      winner: "black",
    });

    expect(model.status).toBe("ready");

    if (model.status !== "ready") {
      return;
    }

    expect(model.review).toBe(review);
    expect(model.reviewedDisc).toBe("black");
    expect(model.messages.moveMessages).toBeInstanceOf(Map);
  });

  it("builds an error model while keeping playback available", () => {
    const session = playFirstLegalMoves(8);
    const model = createErrorGameReviewModel(
      {
        currentMoveNumber: 2,
        moveHistory: session.moveHistory,
        players: createMatchPlayerSettings("onePlayer", "level1", "black"),
        winner: "black",
      },
      "Review failed",
    );

    expect(model.status).toBe("error");

    if (model.status !== "error") {
      return;
    }

    expect(model.errorMessage).toBe("Review failed");
    expect(model.playbackBoards).toHaveLength(session.moveHistory.length + 1);
    expect(model.review).toBeNull();
  });

  it("opens a winning review on a lesson position instead of the final board", () => {
    const session = createDebugSession("blackWin");
    const model = createGameReviewModel({
      currentMoveNumber: session.moveHistory.length,
      moveHistory: session.moveHistory,
      players: createMatchPlayerSettings("onePlayer", "level1", "black"),
      winner: session.winner,
    });

    expect(model.status).toBe("ready");

    if (model.status !== "ready") {
      return;
    }

    expect(model.safeMoveNumber).toBe(model.maxMoveNumber);
    expect(model.displayedReviewedMove).not.toBeNull();
    expect(model.displayedMoveNumber).not.toBe(model.maxMoveNumber);
    expect(model.playbackDisplay.mode).toBe("reviewTarget");
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
