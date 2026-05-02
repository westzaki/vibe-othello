import {
  getLegalMoves,
  placeDisc,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";

export type MoveScore = {
  move: SquareIndex;
  score: number;
};

export function getScoredMoves(
  board: Board,
  disc: DiscColor,
  evaluateMove: (nextBoard: Board, move: SquareIndex) => number,
  legalMoves = getLegalMoves(board, disc),
): MoveScore[] {
  return legalMoves.map((move) => ({
    move,
    score: evaluateMove(placeDisc(board, move, disc), move),
  }));
}

export function chooseHighestScoredMove(
  scoredMoves: MoveScore[],
): SquareIndex | null {
  if (scoredMoves.length === 0) {
    return null;
  }

  return scoredMoves.reduce((bestMove, move) =>
    move.score > bestMove.score ? move : bestMove,
  ).move;
}

export function orderMovesByScore(
  scoredMoves: MoveScore[],
  direction: "ascending" | "descending",
): SquareIndex[] {
  return [...scoredMoves]
    .sort((firstMove, secondMove) =>
      direction === "descending"
        ? secondMove.score - firstMove.score
        : firstMove.score - secondMove.score,
    )
    .map(({ move }) => move);
}
