import type { Board, DiscColor } from "../../game/othello";
import {
  getCornerDifference,
  getDiscCountDifference,
  getMobilityDifference,
} from "./evaluationFeatures";

const cornerScore = 25;
const mobilityWeight = 2;

export function evaluateBoard(board: Board, disc: DiscColor): number {
  return (
    getDiscCountDifference(board, disc) +
    getMobilityDifference(board, disc) * mobilityWeight +
    getCornerDifference(board, disc) * cornerScore
  );
}
