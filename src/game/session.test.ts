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

describe("game session", () => {
  it("creates a not-started session", () => {
    const session = createGameSession();

    expect(session.status).toBe("notStarted");
    expect(session.currentDisc).toBe("black");
    expect(session.discCounts).toEqual({ black: 2, white: 2 });
    expect(session.lastMove).toBeNull();
    expect(session.message).toBeNull();
    expect(session.winner).toBeNull();
    expect(getSessionLegalMoves(session)).toEqual([]);
  });

  it("starts a new game with black to move", () => {
    const session = startNewGame();

    expect(session.status).toBe("playing");
    expect(session.currentDisc).toBe("black");
    expect(session.discCounts).toEqual({ black: 2, white: 2 });
    expect(session.lastMove).toBeNull();
    expect(session.message).toBeNull();
    expect(session.winner).toBeNull();
    expect(getSessionLegalMoves(session)).toEqual([19, 26, 37, 44]);
  });

  it("ends the current game with a winner and disc counts", () => {
    const session = endGame(startNewGame());

    expect(session.status).toBe("ended");
    expect(session.discCounts).toEqual({ black: 2, white: 2 });
    expect(session.winner).toBe("draw");
    expect(getSessionLegalMoves(session)).toEqual([]);
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
    const board: Board = Array.from({ length: 64 }, () => "black");

    board[1] = "white";
    board[2] = null;
    board[4] = "white";
    board[5] = null;

    const session = createPlayingSession(board, "black");
    const result = placeCurrentDisc(session, 2);

    expect(result.move).toEqual({ flippedSquares: [1], placedSquare: 2 });
    expect(result.session.status).toBe("playing");
    expect(result.session.currentDisc).toBe("black");
    expect(result.session.lastMove).toBe(2);
    expect(result.session.message).toBe(
      "White has no legal moves. Black plays again.",
    );
    expect(getSessionLegalMoves(result.session)).toEqual([5]);
  });

  it("ends automatically when neither player has legal moves after a move", () => {
    const board: Board = Array.from({ length: 64 }, () => "black");

    board[1] = "white";
    board[2] = null;

    const session = createPlayingSession(board, "black");
    const result = placeCurrentDisc(session, 2);

    expect(result.move).toEqual({ flippedSquares: [1], placedSquare: 2 });
    expect(result.session.status).toBe("ended");
    expect(result.session.winner).toBe("black");
    expect(result.session.lastMove).toBe(2);
    expect(result.session.discCounts).toEqual({ black: 64, white: 0 });
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
    lastMove: null,
    message: null,
    status: "playing",
    winner: null,
  };
}
