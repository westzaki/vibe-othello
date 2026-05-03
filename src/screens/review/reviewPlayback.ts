import { getMinimaxMoveScores } from "../../cpu";
import {
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  isGameOver,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../../game/othello";
import type { MoveRecord, PracticeSessionOptions } from "../../game/session";
import { defaultTeacherReviewConfig } from "../../teacher";

export type PlaybackPositionReview = {
  bestSquare: SquareIndex | null;
  disc: DiscColor;
  legalMoves: SquareIndex[];
};

export function createPlaybackBoards(moveHistory: MoveRecord[]): Board[] {
  return [
    moveHistory[0]?.boardBefore ?? createInitialBoard(),
    ...moveHistory.map((move) => move.boardAfter),
  ];
}

export function clampMoveNumber(
  moveNumber: number,
  maxMoveNumber: number,
): number {
  return Math.max(0, Math.min(moveNumber, maxMoveNumber));
}

export function createPlaybackPositionReview(
  board: Board,
  nextDisc: DiscColor,
): PlaybackPositionReview {
  if (isGameOver(board)) {
    return {
      bestSquare: null,
      disc: nextDisc,
      legalMoves: [],
    };
  }

  const nextDiscLegalMoves = getLegalMoves(board, nextDisc);
  const disc = nextDiscLegalMoves.length > 0 ? nextDisc : getNextDisc(nextDisc);
  const legalMoves =
    nextDiscLegalMoves.length > 0
      ? nextDiscLegalMoves
      : getLegalMoves(board, disc);
  const bestSquare =
    getMinimaxMoveScores(board, disc, {
      searchDepth: defaultTeacherReviewConfig.searchDepth,
    })[0]?.move ?? null;

  return {
    bestSquare,
    disc,
    legalMoves,
  };
}

export function createPracticeOptionsFromMoveNumber(
  moveHistory: MoveRecord[],
  playbackBoards: Board[],
  moveNumber: number,
): PracticeSessionOptions {
  const practiceMoveNumber = moveNumber === 0 ? 0 : moveNumber - 1;
  const practiceBoard =
    playbackBoards[practiceMoveNumber] ?? createInitialBoard();
  const practiceLastMove =
    practiceMoveNumber === 0
      ? null
      : (moveHistory[practiceMoveNumber - 1]?.square ?? null);

  return {
    board: practiceBoard,
    lastMove: practiceLastMove,
    nextDisc: getNextDiscForMoveNumber(moveHistory, practiceMoveNumber),
  };
}

export function getNextDiscForMoveNumber(
  moveHistory: MoveRecord[],
  moveNumber: number,
): DiscColor {
  if (moveNumber === 0) {
    return "black";
  }

  const move = moveHistory[moveNumber - 1];

  return move === undefined ? "black" : getNextDisc(move.disc);
}
