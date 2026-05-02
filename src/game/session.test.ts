import { describe, expect, it } from "vitest";
import {
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
} from "./session";

describe("game session", () => {
  it("creates a not-started session", () => {
    const session = createGameSession();

    expect(session.status).toBe("notStarted");
    expect(session.currentDisc).toBe("black");
    expect(getSessionLegalMoves(session)).toEqual([]);
  });

  it("starts a new game with black to move", () => {
    const session = startNewGame();

    expect(session.status).toBe("playing");
    expect(session.currentDisc).toBe("black");
    expect(getSessionLegalMoves(session)).toEqual([19, 26, 37, 44]);
  });

  it("ends the current game", () => {
    const session = endGame(startNewGame());

    expect(session.status).toBe("ended");
    expect(getSessionLegalMoves(session)).toEqual([]);
  });

  it("places the current disc and switches turns", () => {
    const session = startNewGame();
    const nextSession = placeCurrentDisc(session, 19);

    expect(nextSession).not.toBe(session);
    expect(nextSession.board[19]).toBe("black");
    expect(nextSession.board[27]).toBe("black");
    expect(nextSession.currentDisc).toBe("white");
  });

  it("does not change the session when placing outside a legal move", () => {
    const session = startNewGame();

    expect(placeCurrentDisc(session, 0)).toBe(session);
  });

  it("does not place discs after the game has ended", () => {
    const session = endGame(startNewGame());

    expect(placeCurrentDisc(session, 19)).toBe(session);
  });
});
