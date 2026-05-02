import { describe, expect, it } from "vitest";
import {
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  type GameSession,
} from "./session";
import type { Board } from "./othello";
import { createBoardFixture } from "../test/boardFixtures";

describe("game session", () => {
  it("creates a not-started session", () => {
    const session = createGameSession();

    expect(session.status).toBe("notStarted");
    expect(session.currentDisc).toBe("black");
    expect(session.discCounts).toEqual({ black: 2, white: 2 });
    expect(session.endReason).toBeNull();
    expect(session.lastMove).toBeNull();
    expect(session.message).toBeNull();
    expect(session.moveHistory).toEqual([]);
    expect(session.winner).toBeNull();
    expect(getSessionLegalMoves(session)).toEqual([]);
  });

  it("starts a new game with black to move", () => {
    const session = startNewGame();

    expect(session.status).toBe("playing");
    expect(session.currentDisc).toBe("black");
    expect(session.discCounts).toEqual({ black: 2, white: 2 });
    expect(session.endReason).toBeNull();
    expect(session.lastMove).toBeNull();
    expect(session.message).toBeNull();
    expect(session.moveHistory).toEqual([]);
    expect(session.winner).toBeNull();
    expect(getSessionLegalMoves(session)).toEqual([19, 26, 37, 44]);
  });

  it("abandons the current game without a winner", () => {
    const session = endGame(startNewGame());

    expect(session.status).toBe("ended");
    expect(session.discCounts).toEqual({ black: 2, white: 2 });
    expect(session.endReason).toBe("abandoned");
    expect(session.winner).toBeNull();
    expect(getSessionLegalMoves(session)).toEqual([]);
  });

  it("keeps session end state invariants", () => {
    const abandonedSession = endGame(startNewGame());

    expect(abandonedSession.endReason).toBe("abandoned");
    expect(abandonedSession.winner).toBeNull();

    const completedBoard = createBoardFixture({ 1: "white", 2: null }, "black");
    const completedSession = placeCurrentDisc(
      createPlayingSession(completedBoard, "black"),
      2,
    ).session;

    expect(completedSession.endReason).toBe("completed");
    expect(completedSession.winner).not.toBeNull();
  });

  it("places the current disc and switches turns", () => {
    const session = startNewGame();
    const result = placeCurrentDisc(session, 19);

    expect(result.session).not.toBe(session);
    expect(result.move).toEqual({ flippedSquares: [27], placedSquare: 19 });
    expect(result.session.board[19]).toBe("black");
    expect(result.session.board[27]).toBe("black");
    expect(result.session.discCounts).toEqual({ black: 4, white: 1 });
    expect(result.session.lastMove).toBe(19);
    expect(result.session.message).toBeNull();
    expect(result.session.currentDisc).toBe("white");
    expect(result.session.moveHistory).toHaveLength(1);
    expect(result.session.moveHistory[0]).toEqual({
      moveNumber: 1,
      disc: "black",
      square: 19,
      boardBefore: session.board,
      boardAfter: result.session.board,
      flippedSquares: [27],
      legalMovesBefore: [19, 26, 37, 44],
    });
    expect(result.session.moveHistory[0].boardBefore).not.toBe(session.board);
    expect(result.session.moveHistory[0].boardAfter).not.toBe(
      result.session.board,
    );
  });

  it("does not change the session when placing outside a legal move", () => {
    const session = startNewGame();

    expect(placeCurrentDisc(session, 0)).toEqual({ move: null, session });
  });

  it("does not place discs after the game has ended", () => {
    const session = endGame(startNewGame());

    expect(placeCurrentDisc(session, 19)).toEqual({ move: null, session });
  });

  it("passes the turn when the next player has no legal moves", () => {
    const board = createBoardFixture(
      {
        1: "white",
        2: null,
        4: "white",
        5: null,
      },
      "black",
    );

    const session = createPlayingSession(board, "black");
    const result = placeCurrentDisc(session, 2);

    expect(result.move).toEqual({ flippedSquares: [1], placedSquare: 2 });
    expect(result.session.status).toBe("playing");
    expect(result.session.currentDisc).toBe("black");
    expect(result.session.lastMove).toBe(2);
    expect(result.session.message).toBe(
      "White has no legal moves. Black plays again.",
    );
    expect(result.session.moveHistory).toHaveLength(1);
    expect(result.session.moveHistory[0].legalMovesBefore).toEqual([2, 5]);
    expect(getSessionLegalMoves(result.session)).toEqual([5]);
  });

  it("ends automatically when neither player has legal moves after a move", () => {
    const board = createBoardFixture({ 1: "white", 2: null }, "black");

    const session = createPlayingSession(board, "black");
    const result = placeCurrentDisc(session, 2);

    expect(result.move).toEqual({ flippedSquares: [1], placedSquare: 2 });
    expect(result.session.status).toBe("ended");
    expect(result.session.endReason).toBe("completed");
    expect(result.session.winner).toBe("black");
    expect(result.session.lastMove).toBe(2);
    expect(result.session.discCounts).toEqual({ black: 64, white: 0 });
    expect(result.session.moveHistory).toHaveLength(1);
    expect(result.session.moveHistory[0].boardAfter).toEqual(
      result.session.board,
    );
    expect(getSessionLegalMoves(result.session)).toEqual([]);
  });
});

function createPlayingSession(
  board: Board,
  currentDisc: GameSession["currentDisc"],
): GameSession {
  return {
    board,
    currentDisc,
    discCounts: { black: 0, white: 0 },
    endReason: null,
    lastMove: null,
    message: null,
    moveHistory: [],
    status: "playing",
    winner: null,
  };
}
