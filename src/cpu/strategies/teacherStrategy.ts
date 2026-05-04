import type { Board, DiscColor, SquareIndex } from "../../game/othello";
import { countEmptySquares } from "../evaluation/evaluationFeatures";
import {
  getIterativeDeepeningMoveScores,
  getPerfectEndgameMoveScores,
} from "./grandmasterStrategy";

const teacherSearchTimeLimitMs = 600;
const teacherPerfectEndgameEmptyThreshold = 10;

export type TeacherMoveScore = {
  move: SquareIndex;
  score: number;
};

export function chooseTeacherMove(
  board: Board,
  disc: DiscColor,
): SquareIndex | null {
  return getTeacherMoveScores(board, disc)[0]?.move ?? null;
}

export function getTeacherMoveScores(
  board: Board,
  disc: DiscColor,
): TeacherMoveScore[] {
  if (countEmptySquares(board) <= teacherPerfectEndgameEmptyThreshold) {
    return getPerfectEndgameMoveScores(board, disc);
  }

  return getIterativeDeepeningMoveScores(board, disc, teacherSearchTimeLimitMs);
}
