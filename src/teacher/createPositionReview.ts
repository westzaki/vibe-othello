import {
  getLegalMoves,
  getNextDisc,
  isGameOver,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import { defaultTeacherReviewConfig } from "./reviewConfig";
import { chooseTeacherGuidanceMove } from "./teacherGuidanceMove";

export type PositionReview = {
  bestSquare: SquareIndex | null;
  disc: DiscColor;
  legalMoves: SquareIndex[];
};

export function createPositionReview(
  board: Board,
  nextDisc: DiscColor,
): PositionReview {
  if (isGameOver(board)) {
    return {
      bestSquare: null,
      disc: nextDisc,
      legalMoves: [],
    };
  }

  const nextDiscLegalMoves = getLegalMoves(board, nextDisc);
  const disc = nextDiscLegalMoves.length > 0 ? nextDisc : getNextDisc(nextDisc);
  const legalMoves =
    nextDiscLegalMoves.length > 0
      ? nextDiscLegalMoves
      : getLegalMoves(board, disc);
  const bestSquare = chooseTeacherGuidanceMove(board, disc, {
    deepSearchDepth: defaultTeacherReviewConfig.deepSearchDepth,
    refutationSearchDepth: defaultTeacherReviewConfig.refutationSearchDepth,
    shallowSearchDepth: defaultTeacherReviewConfig.searchDepth,
    strongCandidateScoreGap: defaultTeacherReviewConfig.strongCandidateScoreGap,
    topCandidateLimit: defaultTeacherReviewConfig.topCandidateLimit,
  });

  return {
    bestSquare,
    disc,
    legalMoves,
  };
}
