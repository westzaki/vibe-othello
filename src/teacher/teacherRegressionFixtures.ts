import type { Board, DiscColor, SquareIndex } from "../game/othello";
import type { MoveReviewReason } from "./reviewTypes";

export type TeacherRegressionFixture = {
  board: Board;
  currentDisc: DiscColor;
  expectedAvoidReasons?: MoveReviewReason[];
  expectedNotBestMove?: SquareIndex;
  note: string;
};

export function createTeacherRegressionFixture(
  fixture: TeacherRegressionFixture,
): TeacherRegressionFixture {
  return fixture;
}

export const teacherRegressionFixtures: TeacherRegressionFixture[] = [];
