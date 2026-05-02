import {
  getLegalMoves,
  placeDisc,
  type Board,
  type DiscColor,
} from "../game/othello";

export type MoveScore = {
  move: number;
  score: number;
};

export function getScoredMoves(
  board: Board,
  disc: DiscColor,
  evaluateMove: (nextBoard: Board, move: number) => number,
  legalMoves = getLegalMoves(board, disc),
): MoveScore[] {
  return legalMoves.map((move) => ({
    move,
    score: evaluateMove(placeDisc(board, move, disc), move),
  }));
}

export function chooseHighestScoredMove(
  scoredMoves: MoveScore[],
): number | null {
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
): number[] {
  return [...scoredMoves]
    .sort((firstMove, secondMove) =>
      direction === "descending"
        ? secondMove.score - firstMove.score
        : firstMove.score - secondMove.score,
    )
    .map(({ move }) => move);
}
