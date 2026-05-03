import {
  applyMove,
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  getWinner,
  hasLegalMove,
  isGameOver,
  type Board,
  type DiscCounts,
  type DiscColor,
  type SquareIndex,
  type Winner,
} from "./othello";

export type GameStatus = "notStarted" | "playing" | "ended";
export type GameEndReason = "completed" | "abandoned";

export type GameSession = {
  board: Board;
  currentDisc: DiscColor;
  discCounts: DiscCounts;
  endReason: GameEndReason | null;
  lastMove: SquareIndex | null;
  message: string | null;
  moveHistory: MoveRecord[];
  status: GameStatus;
  winner: Winner | null;
};

export type MoveRecord = {
  moveNumber: number;
  disc: DiscColor;
  square: SquareIndex;
  boardBefore: Board;
  boardAfter: Board;
  flippedSquares: SquareIndex[];
  legalMovesBefore: SquareIndex[];
};

export type MoveResult = {
  flippedSquares: SquareIndex[];
  placedSquare: SquareIndex;
};

export type PlaceCurrentDiscResult = {
  move: MoveResult | null;
  session: GameSession;
};

export type PracticeSessionOptions = {
  board: Board;
  lastMove: SquareIndex | null;
  nextDisc: DiscColor;
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
    moveHistory: [],
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
    moveHistory: [],
    status: "playing",
    winner: null,
  };
}

export function startPracticeSession({
  board,
  lastMove,
  nextDisc,
}: PracticeSessionOptions): GameSession {
  const practiceBoard = [...board];
  const discCounts = countDiscs(practiceBoard);

  if (isGameOver(practiceBoard)) {
    return {
      board: practiceBoard,
      currentDisc: nextDisc,
      discCounts,
      endReason: "completed",
      lastMove,
      message: null,
      moveHistory: [],
      status: "ended",
      winner: getWinner(practiceBoard),
    };
  }

  const nextDiscCanMove = hasLegalMove(practiceBoard, nextDisc);
  const otherDisc = getNextDisc(nextDisc);
  const currentDisc = nextDiscCanMove ? nextDisc : otherDisc;

  return {
    board: practiceBoard,
    currentDisc,
    discCounts,
    endReason: null,
    lastMove,
    message: nextDiscCanMove
      ? null
      : `${formatDisc(nextDisc)} has no legal moves. ${formatDisc(
          otherDisc,
        )} plays again.`,
    moveHistory: [],
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

export function getSessionLegalMoves(session: GameSession): SquareIndex[] {
  if (session.status !== "playing") {
    return [];
  }

  return getLegalMoves(session.board, session.currentDisc);
}

export function placeCurrentDisc(
  session: GameSession,
  square: SquareIndex,
): PlaceCurrentDiscResult {
  if (session.status !== "playing") {
    return { move: null, session };
  }

  const boardBefore = [...session.board];
  const legalMovesBefore = getLegalMoves(session.board, session.currentDisc);
  const appliedMove = applyMove(session.board, square, session.currentDisc);

  if (appliedMove === null) {
    return { move: null, session };
  }

  const nextBoard = appliedMove.board;
  const boardAfter = [...nextBoard];
  const flippedSquares = appliedMove.flippedSquares.sort(
    (firstSquare, secondSquare) => firstSquare - secondSquare,
  );
  const move: MoveResult = {
    flippedSquares,
    placedSquare: square,
  };
  const nextMoveHistory: MoveRecord[] = [
    ...session.moveHistory,
    {
      moveNumber: session.moveHistory.length + 1,
      disc: session.currentDisc,
      square,
      boardBefore,
      boardAfter,
      flippedSquares,
      legalMovesBefore,
    },
  ];

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
        moveHistory: nextMoveHistory,
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
      moveHistory: nextMoveHistory,
    },
  };
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "Black" : "White";
}
