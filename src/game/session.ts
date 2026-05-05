import {
  applyMove,
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  getWinner,
  isGameOver,
  type Board,
  type DiscCounts,
  type DiscColor,
  type SquareIndex,
  type Winner,
} from "./othello";
import type { PlayerSettings } from "./players";
import {
  createPassNotice,
  resolvePlayableTurn,
  type GameSessionNotice,
} from "./sessionTurn";

export type GameStatus = "notStarted" | "playing" | "ended";
export type GameEndReason = "completed" | "abandoned";
export type { GameSessionNotice } from "./sessionTurn";

export type GameSession = {
  board: Board;
  currentDisc: DiscColor;
  discCounts: DiscCounts;
  endReason: GameEndReason | null;
  lastMove: SquareIndex | null;
  moveHistory: MoveRecord[];
  notice: GameSessionNotice | null;
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
  moveHistory?: MoveRecord[];
  notice?: GameSessionNotice | null;
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
      moveHistory: [],
      notice: null,
      status: "ended",
      winner: getWinner(practiceBoard),
    });
  }

  const nextTurn = resolvePlayableTurn(practiceBoard, nextDisc);

  return createSession({
    board: practiceBoard,
    currentDisc: nextTurn.currentDisc,
    endReason: null,
    lastMove,
    moveHistory: [],
    notice: nextTurn.notice,
    status: "playing",
    winner: null,
  });
}

export function endGame(session: GameSession): GameSession {
  return {
    ...session,
    discCounts: countDiscs(session.board),
    endReason: "abandoned",
    notice: null,
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

export function canUndoSessionMove(
  session: GameSession,
  players: PlayerSettings,
): boolean {
  return getUndoTargetMove(session, players) !== null;
}

export function undoSessionMove(
  session: GameSession,
  players: PlayerSettings,
): GameSession | null {
  const targetMove = getUndoTargetMove(session, players);

  if (targetMove === null) {
    return null;
  }

  const nextMoveHistory = session.moveHistory.slice(
    0,
    targetMove.moveNumber - 1,
  );
  const previousMove = nextMoveHistory.at(-1) ?? null;
  const currentDisc = targetMove.disc;

  return createSession({
    board: [...targetMove.boardBefore],
    currentDisc,
    endReason: null,
    lastMove: previousMove?.square ?? null,
    moveHistory: nextMoveHistory,
    notice: getUndoNotice(currentDisc, previousMove),
    status: "playing",
    winner: null,
  });
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
        moveHistory: nextMoveHistory,
        notice: null,
        status: "ended",
        winner: getWinner(nextBoard),
      },
    };
  }

  const nextDisc = getNextDisc(session.currentDisc);
  const nextTurn = resolvePlayableTurn(
    nextBoard,
    nextDisc,
    session.currentDisc,
  );

  return {
    move,
    session: {
      ...session,
      board: nextBoard,
      currentDisc: nextTurn.currentDisc,
      discCounts,
      lastMove: square,
      moveHistory: nextMoveHistory,
      notice: nextTurn.notice,
    },
  };
}

function getUndoTargetMove(
  session: GameSession,
  players: PlayerSettings,
): MoveRecord | null {
  if (session.status !== "playing" || session.moveHistory.length === 0) {
    return null;
  }

  const lastMove = session.moveHistory.at(-1);

  if (lastMove === undefined) {
    return null;
  }

  const humanDisc = getSingleHumanDisc(players);

  if (humanDisc === null) {
    return lastMove;
  }

  if (lastMove.disc === humanDisc) {
    return lastMove;
  }

  const previousMove = session.moveHistory.at(-2);

  return previousMove?.disc === humanDisc ? previousMove : null;
}

function getSingleHumanDisc(players: PlayerSettings): DiscColor | null {
  const blackIsHuman = players.black.type === "human";
  const whiteIsHuman = players.white.type === "human";

  if (blackIsHuman === whiteIsHuman) {
    return null;
  }

  return blackIsHuman ? "black" : "white";
}

function getUndoNotice(
  currentDisc: DiscColor,
  previousMove: MoveRecord | null,
): GameSessionNotice | null {
  if (previousMove === null || previousMove.disc !== currentDisc) {
    return null;
  }

  return createPassNotice(getNextDisc(currentDisc), currentDisc);
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
  moveHistory = [],
  notice = null,
  status,
  winner = null,
}: CreateSessionOptions): GameSession {
  return {
    board,
    currentDisc,
    discCounts: countDiscs(board),
    endReason,
    lastMove,
    moveHistory,
    notice,
    status,
    winner,
  };
}
