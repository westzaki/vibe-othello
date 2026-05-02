import type { Board, DiscColor } from "../game/othello";
import { evaluateBoard } from "./evaluateBoard";
import { chooseHighestScoredMove, getScoredMoves } from "./moveSelection";

export function chooseOnePlyMove(board: Board, disc: DiscColor): number | null {
  return chooseHighestScoredMove(
    getScoredMoves(board, disc, (nextBoard) => evaluateBoard(nextBoard, disc)),
  );
}
