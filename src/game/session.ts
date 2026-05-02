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
export type GameEndReason = "completed" | "abandoned";

export type GameSession = {
  board: Board;
  currentDisc: DiscColor;
  discCounts: DiscCounts;
  endReason: GameEndReason | null;
  lastMove: number | null;
  message: string | null;
  status: GameStatus;
  winner: Winner | null;
};

export type MoveResult = {
  flippedSquares: number[];
  placedSquare: number;
};

export type PlaceCurrentDiscResult = {
  move: MoveResult | null;
  session: GameSession;
};

export function createGameSession(): GameSession {
  const board = createInitialBoard();

  return {
    board,
    currentDisc: "black",
    discCounts: countDiscs(board),
    endReason: null,
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
    endReason: null,
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
    endReason: "abandoned",
    message: null,
    status: "ended",
    winner: null,
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
): PlaceCurrentDiscResult {
  if (session.status !== "playing") {
    return { move: null, session };
  }

  const nextBoard = placeDisc(session.board, square, session.currentDisc);
  const flippedSquares = getFlippedSquares(
    session.board,
    square,
    session.currentDisc,
  ).sort((firstSquare, secondSquare) => firstSquare - secondSquare);

  if (nextBoard === session.board) {
    return { move: null, session };
  }

  const move: MoveResult = {
    flippedSquares,
    placedSquare: square,
  };

  const discCounts = countDiscs(nextBoard);

  if (isGameOver(nextBoard)) {
    return {
      move,
      session: {
        ...session,
        board: nextBoard,
        discCounts,
        endReason: "completed",
        lastMove: square,
        message: null,
        status: "ended",
        winner: getWinner(nextBoard),
      },
    };
  }

  const nextDisc = getNextDisc(session.currentDisc);
  const nextDiscCanMove = hasLegalMove(nextBoard, nextDisc);
  const currentDisc = nextDiscCanMove ? nextDisc : session.currentDisc;

  return {
    move,
    session: {
      ...session,
      board: nextBoard,
      currentDisc,
      discCounts,
      lastMove: square,
      message: nextDiscCanMove
        ? null
        : `${formatDisc(nextDisc)} has no legal moves. ${formatDisc(
            session.currentDisc,
          )} plays again.`,
    },
  };
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "Black" : "White";
}
