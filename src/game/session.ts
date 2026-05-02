import {
  countDiscs,
  createInitialBoard,
  getFlippedSquares,
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
  flipAnimationId: number;
  flippedSquares: number[];
  lastMove: number | null;
  message: string | null;
  status: GameStatus;
  winner: Winner | null;
};

export function createGameSession(): GameSession {
  const board = createInitialBoard();

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    flipAnimationId: 0,
    flippedSquares: [],
    lastMove: null,
    message: null,
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
    flipAnimationId: 0,
    flippedSquares: [],
    lastMove: null,
    message: null,
    status: "playing",
    winner: null,
  };
}

export function endGame(session: GameSession): GameSession {
  return {
    ...session,
    discCounts: countDiscs(session.board),
    flipAnimationId: session.flipAnimationId,
    flippedSquares: [],
    message: null,
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
  const flippedSquares = getFlippedSquares(
    session.board,
    square,
    session.currentDisc,
  ).sort((firstSquare, secondSquare) => firstSquare - secondSquare);

  if (nextBoard === session.board) {
    return session;
  }

  if (isGameOver(nextBoard)) {
    return {
      ...session,
      board: nextBoard,
      discCounts: countDiscs(nextBoard),
      flipAnimationId: session.flipAnimationId + 1,
      flippedSquares,
      lastMove: square,
      message: null,
      status: "ended",
      winner: getWinner(nextBoard),
    };
  }

  const nextDisc = getNextDisc(session.currentDisc);
  const nextDiscCanMove = hasLegalMove(nextBoard, nextDisc);
  const currentDisc = nextDiscCanMove ? nextDisc : session.currentDisc;

  return {
    ...session,
    board: nextBoard,
    currentDisc,
    discCounts: countDiscs(nextBoard),
    flipAnimationId: session.flipAnimationId + 1,
    flippedSquares,
    lastMove: square,
    message: nextDiscCanMove
      ? null
      : `${formatDisc(nextDisc)} has no legal moves. ${formatDisc(
          session.currentDisc,
        )} plays again.`,
  };
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "Black" : "White";
}
