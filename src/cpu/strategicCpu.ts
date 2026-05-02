import {
  getLegalMoves,
  placeDisc,
  type Board,
  type DiscColor,
} from "../game/othello";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";

export function chooseStrategicMove(
  board: Board,
  disc: DiscColor,
): number | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  return legalMoves.reduce((bestMove, move) => {
    const bestScore = strategicEvaluateBoard(
      placeDisc(board, bestMove, disc),
      disc,
    );
    const score = strategicEvaluateBoard(placeDisc(board, move, disc), disc);

    return score > bestScore ? move : bestMove;
  });
}
