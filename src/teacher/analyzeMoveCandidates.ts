import {
  countEmptySquares,
  getMinimaxMoveScores,
  solveExactEndgameDiscDifference,
  type MinimaxMoveScore,
} from "../cpu";
import {
  CORNER_SQUARES,
  getLegalMoves,
  getNextDisc,
  placeDisc,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import type {
  CandidateMoveReview,
  MoveReviewReason,
  ReviewContext,
  ReviewEvaluationSource,
} from "./reviewTypes";

export type MoveCandidateAnalysis = {
  candidateMoves: CandidateMoveReview[];
  evaluationSource: ReviewEvaluationSource;
};

export type AnalyzeMoveCandidatesOptions = {
  searchDepth: number;
};

const exactEndgameReviewEmptyThreshold = 10;
const exactEndgameReviewScoreWeight = 10;
const cornerGivenScorePenalty = 90;
const dangerSquaresByCorner = new Map<SquareIndex, SquareIndex[]>([
  [0, [1, 8, 9]],
  [7, [6, 14, 15]],
  [56, [48, 49, 57]],
  [63, [54, 55, 62]],
]);

export function analyzeMoveCandidates(
  board: Board,
  disc: DiscColor,
  { searchDepth }: AnalyzeMoveCandidatesOptions,
): MoveCandidateAnalysis {
  const moveScores = getMoveScores(board, disc, searchDepth);

  return {
    candidateMoves: moveScores.scores.map<CandidateMoveReview>(
      ({ move: square, score }, index) => {
        const boardAfter = placeDisc(board, square, disc);

        return {
          square,
          score,
          rank: index + 1,
          reasons: getMoveCandidateReasons({
            boardAfter,
            boardBefore: board,
            disc,
            square,
          }),
        };
      },
    ),
    evaluationSource: moveScores.evaluationSource,
  };
}

function getMoveScores(
  board: Board,
  disc: DiscColor,
  searchDepth: number,
): {
  evaluationSource: ReviewEvaluationSource;
  scores: MinimaxMoveScore[];
} {
  if (countEmptySquares(board) <= exactEndgameReviewEmptyThreshold) {
    return {
      evaluationSource: "exactEndgame",
      scores: getExactEndgameMoveScores(board, disc),
    };
  }

  return {
    evaluationSource: "minimax",
    scores: getTeacherAdjustedMoveScores(
      board,
      disc,
      getMinimaxMoveScores(board, disc, {
        searchDepth,
      }),
    ),
  };
}

function getTeacherAdjustedMoveScores(
  board: Board,
  disc: DiscColor,
  moveScores: MinimaxMoveScore[],
): MinimaxMoveScore[] {
  return moveScores
    .map(({ move, score }) => {
      const boardAfter = placeDisc(board, move, disc);

      return {
        move,
        score:
          score -
          (newlyGivesCorner(board, boardAfter, disc)
            ? cornerGivenScorePenalty
            : 0),
      };
    })
    .sort((firstMove, secondMove) => secondMove.score - firstMove.score);
}

function getExactEndgameMoveScores(
  board: Board,
  disc: DiscColor,
): MinimaxMoveScore[] {
  return getLegalMoves(board, disc)
    .map((move) => ({
      move,
      score:
        solveExactEndgameDiscDifference(
          placeDisc(board, move, disc),
          getNextDisc(disc),
          disc,
        ) * exactEndgameReviewScoreWeight,
    }))
    .sort((firstMove, secondMove) => secondMove.score - firstMove.score);
}

export function getMoveCandidateReasons(
  context: ReviewContext,
): MoveReviewReason[] {
  const reasons: MoveReviewReason[] = [];

  if (isCorner(context.square)) {
    reasons.push("corner");
  }

  if (isDangerSquare(context.boardBefore, context.square)) {
    reasons.push("dangerSquare");
  }

  if (newlyGivesCorner(context.boardBefore, context.boardAfter, context.disc)) {
    reasons.push("cornerGiven");
  }

  return reasons;
}

function newlyGivesCorner(
  boardBefore: ReviewContext["boardBefore"],
  boardAfter: ReviewContext["boardAfter"],
  disc: DiscColor,
) {
  const opponentDisc = getNextDisc(disc);
  const cornerMovesBefore = getLegalMoves(boardBefore, opponentDisc).filter(
    isCorner,
  );
  const cornerMovesAfter = getLegalMoves(boardAfter, opponentDisc).filter(
    isCorner,
  );

  return cornerMovesAfter.some(
    (cornerMove) => !cornerMovesBefore.includes(cornerMove),
  );
}

function isCorner(square: SquareIndex): boolean {
  return CORNER_SQUARES.some((corner) => corner === square);
}

function isDangerSquare(
  board: ReviewContext["boardBefore"],
  square: SquareIndex,
) {
  for (const [corner, dangerSquares] of dangerSquaresByCorner) {
    if (board[corner] === null && dangerSquares.includes(square)) {
      return true;
    }
  }

  return false;
}
