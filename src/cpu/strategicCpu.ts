import type { Board, DiscColor } from "../game/othello";
import { chooseHighestScoredMove, getScoredMoves } from "./moveSelection";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";

export function chooseStrategicMove(
  board: Board,
  disc: DiscColor,
): number | null {
  return chooseHighestScoredMove(
    getScoredMoves(board, disc, (nextBoard) =>
      strategicEvaluateBoard(nextBoard, disc),
    ),
  );
}
