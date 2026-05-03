import type { Board, DiscColor, SquareIndex } from "../game/othello";
import { evaluateBoard } from "./evaluation/evaluateBoard";
import { chooseHighestScoredMove, getScoredMoves } from "./moveSelection";

export function chooseOnePlyMove(
  board: Board,
  disc: DiscColor,
): SquareIndex | null {
  return chooseHighestScoredMove(
    getScoredMoves(board, disc, (nextBoard) => evaluateBoard(nextBoard, disc)),
  );
}
