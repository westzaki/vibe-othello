import {
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  getWinner,
  hasLegalMove,
  isGameOver,
  placeDisc,
  type Board,
  type DiscCounts,
  type DiscColor,
  type Winner,
} from "./othello";

export type GameStatus = "notStarted" | "playing" | "ended";

export type GameSession = {
  board: Board;
  currentDisc: DiscColor;
  discCounts: DiscCounts;
  lastMove: number | null;
  status: GameStatus;
  winner: Winner | null;
};

export function createGameSession(): GameSession {
  const board = createInitialBoard();

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    lastMove: null,
    status: "notStarted",
    winner: null,
  };
}

export function startNewGame(): GameSession {
  const board = createInitialBoard();

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    lastMove: null,
    status: "playing",
    winner: null,
  };
}

export function endGame(session: GameSession): GameSession {
  return {
    ...session,
    discCounts: countDiscs(session.board),
    status: "ended",
    winner: getWinner(session.board),
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

  if (isGameOver(nextBoard)) {
    return {
      ...session,
      board: nextBoard,
      discCounts: countDiscs(nextBoard),
      lastMove: square,
      status: "ended",
      winner: getWinner(nextBoard),
    };
  }

  const nextDisc = getNextDisc(session.currentDisc);
  const currentDisc =
    hasLegalMove(nextBoard, nextDisc) ? nextDisc : session.currentDisc;

  return {
    ...session,
    board: nextBoard,
    currentDisc,
    discCounts: countDiscs(nextBoard),
    lastMove: square,
  };
}
