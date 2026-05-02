import {
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  placeDisc,
  type Board,
  type Disc,
} from "./othello";

export type GameStatus = "notStarted" | "playing" | "ended";

export type GameSession = {
  board: Board;
  currentDisc: Disc;
  status: GameStatus;
};

export function createGameSession(): GameSession {
  return {
    board: createInitialBoard(),
    currentDisc: "black",
    status: "notStarted",
  };
}

export function startNewGame(): GameSession {
  return {
    board: createInitialBoard(),
    currentDisc: "black",
    status: "playing",
  };
}

export function endGame(session: GameSession): GameSession {
  return {
    ...session,
    status: "ended",
  };
}

export function getSessionLegalMoves(session: GameSession): number[] {
  if (session.status !== "playing") {
    return [];
  }

  return getLegalMoves(session.board, session.currentDisc);
}

export function placeCurrentDisc(
  session: GameSession,
  square: number,
): GameSession {
  if (session.status !== "playing") {
    return session;
  }

  const nextBoard = placeDisc(session.board, square, session.currentDisc);

  if (nextBoard === session.board) {
    return session;
  }

  return {
    ...session,
    board: nextBoard,
    currentDisc: getNextDisc(session.currentDisc),
  };
}
