import { describe, expect, it } from "vitest";
import {
  canUndoSessionMove,
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  startPracticeSession,
  undoSessionMove,
  type GameSession,
} from "./session";
import type { Board, DiscColor } from "./othello";
import type { PlayerSettings } from "./players";
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

  it("starts a practice session from a provided board", () => {
    const sourceSession = placeCurrentDisc(startNewGame(), 19).session;
    const practiceSession = startPracticeSession({
      board: sourceSession.board,
      lastMove: sourceSession.lastMove,
      nextDisc: sourceSession.currentDisc,
    });

    expect(practiceSession.status).toBe("playing");
    expect(practiceSession.currentDisc).toBe("white");
    expect(practiceSession.discCounts).toEqual({ black: 4, white: 1 });
    expect(practiceSession.lastMove).toBe(19);
    expect(practiceSession.message).toBeNull();
    expect(practiceSession.moveHistory).toEqual([]);
    expect(getSessionLegalMoves(practiceSession)).toEqual([18, 20, 34]);
  });

  it("passes the turn when starting practice from a position with no move for the next player", () => {
    const board = createBoardFixture(
      {
        1: "white",
        2: null,
        4: "white",
        5: null,
      },
      "black",
    );
    const sourceSession = placeCurrentDisc(
      createPlayingSession(board, "black"),
      2,
    ).session;

    const practiceSession = startPracticeSession({
      board: sourceSession.board,
      lastMove: sourceSession.lastMove,
      nextDisc: "white",
    });

    expect(practiceSession.status).toBe("playing");
    expect(practiceSession.currentDisc).toBe("black");
    expect(practiceSession.lastMove).toBe(2);
    expect(practiceSession.message).toBe(
      "White has no legal moves. Black plays again.",
    );
    expect(practiceSession.moveHistory).toEqual([]);
    expect(getSessionLegalMoves(practiceSession)).toEqual([5]);
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

  it("does not allow undo at the start of a game", () => {
    const session = startNewGame();
    const players = createTwoPlayerSettings();

    expect(canUndoSessionMove(session, players)).toBe(false);
    expect(undoSessionMove(session, players)).toBeNull();
  });

  it("undoes the last single move in a two-player game", () => {
    const session = startNewGame();
    const afterBlackMove = placeCurrentDisc(session, 19).session;
    const players = createTwoPlayerSettings();

    const undoneSession = undoSessionMove(afterBlackMove, players);

    expect(undoneSession).not.toBeNull();
    expect(undoneSession?.board).toEqual(session.board);
    expect(undoneSession?.currentDisc).toBe("black");
    expect(undoneSession?.discCounts).toEqual({ black: 2, white: 2 });
    expect(undoneSession?.lastMove).toBeNull();
    expect(undoneSession?.message).toBeNull();
    expect(undoneSession?.moveHistory).toEqual([]);
    expect(undoneSession?.status).toBe("playing");
  });

  it("undoes a human black move and CPU reply as one pair in a one-player game", () => {
    const session = startNewGame();
    const afterHumanMove = placeCurrentDisc(session, 19).session;
    const afterCpuReply = placeCurrentDisc(afterHumanMove, 18).session;
    const players = createOnePlayerSettings("black");

    const undoneSession = undoSessionMove(afterCpuReply, players);

    expect(undoneSession).not.toBeNull();
    expect(undoneSession?.board).toEqual(session.board);
    expect(undoneSession?.currentDisc).toBe("black");
    expect(undoneSession?.moveHistory).toEqual([]);
    expect(undoneSession?.lastMove).toBeNull();
  });

  it("undoes a human white move and CPU reply back to before the human move", () => {
    const session = startNewGame();
    const afterOpeningCpuMove = placeCurrentDisc(session, 19).session;
    const afterHumanMove = placeCurrentDisc(afterOpeningCpuMove, 18).session;
    const cpuReply = getSessionLegalMoves(afterHumanMove)[0];
    const afterCpuReply = placeCurrentDisc(afterHumanMove, cpuReply).session;
    const players = createOnePlayerSettings("white");

    const undoneSession = undoSessionMove(afterCpuReply, players);

    expect(undoneSession).not.toBeNull();
    expect(undoneSession?.board).toEqual(afterOpeningCpuMove.board);
    expect(undoneSession?.currentDisc).toBe("white");
    expect(undoneSession?.moveHistory).toEqual(
      afterOpeningCpuMove.moveHistory,
    );
    expect(undoneSession?.lastMove).toBe(afterOpeningCpuMove.lastMove);
  });

  it("does not corrupt move history when undoing a two-player move", () => {
    const afterFirstMove = placeCurrentDisc(startNewGame(), 19).session;
    const afterSecondMove = placeCurrentDisc(afterFirstMove, 18).session;
    const afterThirdMove = placeCurrentDisc(afterSecondMove, 17).session;
    const players = createTwoPlayerSettings();

    const undoneSession = undoSessionMove(afterThirdMove, players);

    expect(undoneSession).not.toBeNull();
    expect(undoneSession?.board).toEqual(afterSecondMove.board);
    expect(undoneSession?.moveHistory).toEqual(afterSecondMove.moveHistory);
    expect(undoneSession?.moveHistory.map((move) => move.moveNumber)).toEqual([
      1, 2,
    ]);
    expect(undoneSession?.lastMove).toBe(afterSecondMove.lastMove);
  });
});

function createTwoPlayerSettings(): PlayerSettings {
  return {
    black: {
      cpuLevel: "level1",
      type: "human",
    },
    white: {
      cpuLevel: "level1",
      type: "human",
    },
  };
}

function createOnePlayerSettings(humanDisc: DiscColor): PlayerSettings {
  return {
    black: {
      cpuLevel: "level1",
      type: humanDisc === "black" ? "human" : "cpu",
    },
    white: {
      cpuLevel: "level1",
      type: humanDisc === "white" ? "human" : "cpu",
    },
  };
}

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
