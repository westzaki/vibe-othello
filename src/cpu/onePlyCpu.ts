import {
  getLegalMoves,
  placeDisc,
  type Board,
  type DiscColor,
} from "../game/othello";
import { evaluateBoard } from "./evaluateBoard";

export function chooseOnePlyMove(board: Board, disc: DiscColor): number | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  return legalMoves.reduce((bestMove, move) => {
    const bestScore = evaluateBoard(placeDisc(board, bestMove, disc), disc);
    const score = evaluateBoard(placeDisc(board, move, disc), disc);

    return score > bestScore ? move : bestMove;
  });
}
