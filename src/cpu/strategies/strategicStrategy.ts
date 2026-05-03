import type { Board, DiscColor } from "../../game/othello";
import { strategicEvaluateBoard } from "../evaluation/strategicEvaluateBoard";
import { chooseHighestScoredMove, getScoredMoves } from "../moveSelection";

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
