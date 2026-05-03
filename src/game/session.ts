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

type CreateSessionOptions = {
  board: Board;
  currentDisc: DiscColor;
  endReason?: GameEndReason | null;
  lastMove?: SquareIndex | null;
  message?: string | null;
  moveHistory?: MoveRecord[];
  status: GameStatus;
  winner?: Winner | null;
};

export function createGameSession(): GameSession {
  return createInitialSession("notStarted");
}

export function startNewGame(): GameSession {
  return createInitialSession("playing");
}

export function startPracticeSession({
  board,
  lastMove,
  nextDisc,
}: PracticeSessionOptions): GameSession {
  const practiceBoard = [...board];

  if (isGameOver(practiceBoard)) {
    return createSession({
      board: practiceBoard,
      currentDisc: nextDisc,
      endReason: "completed",
      lastMove,
      message: null,
      moveHistory: [],
      status: "ended",
      winner: getWinner(practiceBoard),
    });
  }

  const nextDiscCanMove = hasLegalMove(practiceBoard, nextDisc);
  const otherDisc = getNextDisc(nextDisc);
  const currentDisc = nextDiscCanMove ? nextDisc : otherDisc;

  return createSession({
    board: practiceBoard,
    currentDisc,
    endReason: null,
    lastMove,
    message: nextDiscCanMove ? null : createPassMessage(nextDisc, otherDisc),
    moveHistory: [],
    status: "playing",
    winner: null,
  });
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
        : createPassMessage(nextDisc, session.currentDisc),
      moveHistory: nextMoveHistory,
    },
  };
}

function createInitialSession(status: GameStatus): GameSession {
  return createSession({
    board: createInitialBoard(),
    currentDisc: "black",
    status,
  });
}

function createSession({
  board,
  currentDisc,
  endReason = null,
  lastMove = null,
  message = null,
  moveHistory = [],
  status,
  winner = null,
}: CreateSessionOptions): GameSession {
  return {
    board,
    currentDisc,
    discCounts: countDiscs(board),
    endReason,
    lastMove,
    message,
    moveHistory,
    status,
    winner,
  };
}

function createPassMessage(skippedDisc: DiscColor, nextDisc: DiscColor): string {
  return `${formatDisc(skippedDisc)} has no legal moves. ${formatDisc(
    nextDisc,
  )} plays again.`;
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "Black" : "White";
}
