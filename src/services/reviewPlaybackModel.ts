import {
  createInitialBoard,
  getNextDisc,
  type Board,
  type DiscColor,
} from "../game/othello";
import type { MoveRecord, PracticeSessionOptions } from "../game/session";
import {
  createPositionReview,
  type PositionReview,
  type ReviewedMove,
} from "../teacher";

export type PlaybackPositionReview = PositionReview;
export type ReviewPlaybackMode = "position" | "reviewTarget";

export type ReviewPlaybackDisplay = {
  board: Board;
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  mode: ReviewPlaybackMode;
  positionReview: PositionReview;
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
  return createPositionReview(board, nextDisc);
}

export function createReviewPlaybackDisplay(
  moveHistory: MoveRecord[],
  playbackBoards: Board[],
  moveNumber: number,
  reviewedMove: ReviewedMove | null,
): ReviewPlaybackDisplay {
  if (reviewedMove !== null && reviewedMove.moveNumber === moveNumber) {
    return {
      board: reviewedMove.boardBefore,
      currentMove: reviewedMove,
      currentMoveNumber: reviewedMove.moveNumber,
      mode: "reviewTarget",
      positionReview: {
        bestSquare: reviewedMove.review.bestSquare,
        disc: reviewedMove.disc,
        legalMoves: reviewedMove.legalMovesBefore,
      },
    };
  }

  const board = playbackBoards[moveNumber] ?? createInitialBoard();

  return {
    board,
    currentMove:
      moveNumber === 0 ? null : (moveHistory[moveNumber - 1] ?? null),
    currentMoveNumber: moveNumber,
    mode: "position",
    positionReview: createPlaybackPositionReview(
      board,
      getNextDiscForMoveNumber(moveHistory, moveNumber),
    ),
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
