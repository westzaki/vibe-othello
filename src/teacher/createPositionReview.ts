import { getTeacherMoveScores } from "../cpu";
import {
  getLegalMoves,
  getNextDisc,
  isGameOver,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";

export type PositionReview = {
  bestSquare: SquareIndex | null;
  disc: DiscColor;
  legalMoves: SquareIndex[];
};

export function createPositionReview(
  board: Board,
  nextDisc: DiscColor,
): PositionReview {
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
    getTeacherMoveScores(board, disc)[0]?.move ?? null;

  return {
    bestSquare,
    disc,
    legalMoves,
  };
}
