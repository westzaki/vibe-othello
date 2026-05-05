import {
  countEmptySquares,
  getExactEndgameMoveScores as getCpuExactEndgameMoveScores,
  getMinimaxMoveScores,
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
  CandidateMoveMetrics,
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
const mobilitySwingThreshold = 3;
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
  const bestScore = moveScores.scores[0]?.score ?? 0;

  return {
    candidateMoves: moveScores.scores.map<CandidateMoveReview>(
      ({ move: square, score }, index) => {
        const boardAfter = placeDisc(board, square, disc);
        const metrics = getMoveCandidateMetrics({
          bestScore,
          boardAfter,
          boardBefore: board,
          disc,
          score,
          square,
        });

        return {
          metrics,
          rank: index + 1,
          reasons: getMoveCandidateReasonsFromMetrics(metrics),
          score,
          square,
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
      scores: getWeightedExactEndgameMoveScores(board, disc),
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

function getWeightedExactEndgameMoveScores(
  board: Board,
  disc: DiscColor,
): MinimaxMoveScore[] {
  return getCpuExactEndgameMoveScores(board, disc).map(({ move, score }) => ({
    move,
    score: score * exactEndgameReviewScoreWeight,
  }));
}

export function getMoveCandidateReasons(
  context: ReviewContext,
): MoveReviewReason[] {
  return getMoveCandidateReasonsFromMetrics(
    getMoveCandidateMetrics({
      bestScore: 0,
      boardAfter: context.boardAfter,
      boardBefore: context.boardBefore,
      disc: context.disc,
      score: 0,
      square: context.square,
    }),
  );
}

function getMoveCandidateReasonsFromMetrics(
  metrics: CandidateMoveMetrics,
): MoveReviewReason[] {
  const reasons: MoveReviewReason[] = [];

  if (metrics.isCorner) {
    reasons.push("corner");
  }

  if (metrics.isDangerSquare) {
    reasons.push("dangerSquare");
  }

  if (metrics.givesOpponentCorner) {
    reasons.push("cornerGiven");
  }

  if (metrics.mobilitySwing >= mobilitySwingThreshold) {
    reasons.push("mobilityGain");
  }

  if (metrics.mobilitySwing <= -mobilitySwingThreshold) {
    reasons.push("mobilityLoss");
  }

  return reasons;
}

function getMoveCandidateMetrics({
  bestScore,
  boardAfter,
  boardBefore,
  disc,
  score,
  square,
}: ReviewContext & {
  bestScore: number;
  score: number;
}): CandidateMoveMetrics {
  const opponentDisc = getNextDisc(disc);
  const playerMobilityBefore = getLegalMoves(boardBefore, disc).length;
  const playerMobilityAfter = getLegalMoves(boardAfter, disc).length;
  const opponentMobilityBefore = getLegalMoves(
    boardBefore,
    opponentDisc,
  ).length;
  const opponentMobilityAfter = getLegalMoves(boardAfter, opponentDisc).length;
  const mobilityDifferenceBefore =
    playerMobilityBefore - opponentMobilityBefore;
  const mobilityDifferenceAfter = playerMobilityAfter - opponentMobilityAfter;

  return {
    givesOpponentCorner: newlyGivesCorner(boardBefore, boardAfter, disc),
    isCorner: isCorner(square),
    isDangerSquare: isDangerSquare(boardBefore, square),
    mobilityDifferenceAfter,
    mobilityDifferenceBefore,
    mobilitySwing: mobilityDifferenceAfter - mobilityDifferenceBefore,
    opponentMobilityAfter,
    opponentMobilityBefore,
    opponentMobilityDelta: opponentMobilityAfter - opponentMobilityBefore,
    playerMobilityAfter,
    playerMobilityBefore,
    playerMobilityDelta: playerMobilityAfter - playerMobilityBefore,
    scoreGapFromBest: Math.max(0, bestScore - score),
  };
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
