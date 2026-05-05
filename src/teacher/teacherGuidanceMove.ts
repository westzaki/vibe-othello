import {
  choosePerfectEndgameMove,
  countEmptySquares,
  strategicEvaluateBoard,
} from "../cpu";
import {
  countDiscs,
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import {
  analyzeMoveCandidates,
  type MoveCandidateAnalysis,
} from "./analyzeMoveCandidates";
import type { CandidateMoveReview } from "./reviewTypes";

export type TeacherGuidanceMoveOptions = {
  deepSearchDepth?: number;
  shallowSearchDepth?: number;
  topCandidateLimit?: number;
};

const defaultTeacherGuidanceShallowSearchDepth = 3;
const defaultTeacherGuidanceDeepSearchDepth = 6;
const defaultTeacherGuidanceTopCandidateLimit = 4;
const deepeningCloseScoreGap = 36;
const deepeningMobilitySwing = 4;
const finalScoreWeight = 1000;

export function chooseTeacherGuidanceMove(
  board: Board,
  disc: DiscColor,
  {
    deepSearchDepth = defaultTeacherGuidanceDeepSearchDepth,
    shallowSearchDepth = defaultTeacherGuidanceShallowSearchDepth,
    topCandidateLimit = defaultTeacherGuidanceTopCandidateLimit,
  }: TeacherGuidanceMoveOptions = {},
): SquareIndex | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  if (shouldUseTeacherExactEndgame(board, disc)) {
    return choosePerfectEndgameMove(board, disc);
  }

  const shallowAnalysis = analyzeMoveCandidates(board, disc, {
    searchDepth: shallowSearchDepth,
  });
  const deepenedScores = getDeepenedTeacherMoveScores({
    analysis: shallowAnalysis,
    board,
    deepSearchDepth,
    disc,
    topCandidateLimit,
  });

  return deepenedScores[0]?.square ?? shallowAnalysis.candidateMoves[0]?.square ?? null;
}

export function shouldUseTeacherExactEndgame(
  board: Board,
  disc: DiscColor,
): boolean {
  return shouldUseTeacherExactEndgameByCounts(
    countEmptySquares(board),
    getLegalMoves(board, disc).length,
  );
}

export function shouldUseTeacherExactEndgameByCounts(
  emptyCount: number,
  legalMoveCount: number,
): boolean {
  return (
    emptyCount <= 10 ||
    (emptyCount <= 12 && legalMoveCount <= 4) ||
    (emptyCount <= 14 && legalMoveCount <= 3)
  );
}

function getDeepenedTeacherMoveScores({
  analysis,
  board,
  deepSearchDepth,
  disc,
  topCandidateLimit,
}: {
  analysis: MoveCandidateAnalysis;
  board: Board;
  deepSearchDepth: number;
  disc: DiscColor;
  topCandidateLimit: number;
}): CandidateMoveReview[] {
  const deepeningCandidates = selectTeacherDeepeningCandidates(
    analysis.candidateMoves,
    topCandidateLimit,
  );
  const deepenedScores = scoreDeepeningCandidates({
    board,
    candidates: deepeningCandidates,
    deepSearchDepth,
    disc,
  });

  return analysis.candidateMoves
    .map((candidate) => ({
      ...candidate,
      score: deepenedScores.get(candidate.square) ?? candidate.score,
    }))
    .sort(compareCandidateScores)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
}

export function selectTeacherDeepeningCandidates(
  candidateMoves: CandidateMoveReview[],
  topCandidateLimit = defaultTeacherGuidanceTopCandidateLimit,
): CandidateMoveReview[] {
  return candidateMoves.filter(
    (candidate) =>
      candidate.rank <= topCandidateLimit ||
      candidate.metrics.isCorner ||
      candidate.metrics.givesOpponentCorner ||
      candidate.metrics.isDangerSquare ||
      candidate.metrics.scoreGapFromBest <= deepeningCloseScoreGap ||
      candidate.metrics.anchoredEdgeDelta > 0 ||
      Math.abs(candidate.metrics.mobilitySwing) >= deepeningMobilitySwing,
  );
}

function scoreDeepeningCandidates({
  board,
  candidates,
  deepSearchDepth,
  disc,
}: {
  board: Board;
  candidates: CandidateMoveReview[];
  deepSearchDepth: number;
  disc: DiscColor;
}): Map<SquareIndex, number> {
  const scores = new Map<SquareIndex, number>();
  let alpha = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const score = minimax(
      placeDisc(board, candidate.square, disc),
      getNextDisc(disc),
      disc,
      deepSearchDepth - 1,
      alpha,
      Number.POSITIVE_INFINITY,
    );

    scores.set(candidate.square, score);
    alpha = Math.max(alpha, score);
  }

  return scores;
}

function minimax(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (isGameOver(board)) {
    return getFinalDiscDifference(board, maximizingDisc) * finalScoreWeight;
  }

  if (depth <= 0) {
    return strategicEvaluateBoard(board, maximizingDisc);
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    return minimax(board, nextDisc, maximizingDisc, depth - 1, alpha, beta);
  }

  return currentDisc === maximizingDisc
    ? getMaxScore(board, currentDisc, maximizingDisc, legalMoves, depth, alpha, beta)
    : getMinScore(board, currentDisc, maximizingDisc, legalMoves, depth, alpha, beta);
}

function getMaxScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
): number {
  let bestScore = Number.NEGATIVE_INFINITY;
  let nextAlpha = alpha;

  for (const move of orderMoves(board, currentDisc, maximizingDisc, legalMoves, true)) {
    const score = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      nextAlpha,
      beta,
    );

    bestScore = Math.max(bestScore, score);
    nextAlpha = Math.max(nextAlpha, bestScore);

    if (beta <= nextAlpha) {
      break;
    }
  }

  return bestScore;
}

function getMinScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
): number {
  let bestScore = Number.POSITIVE_INFINITY;
  let nextBeta = beta;

  for (const move of orderMoves(board, currentDisc, maximizingDisc, legalMoves, false)) {
    const score = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      alpha,
      nextBeta,
    );

    bestScore = Math.min(bestScore, score);
    nextBeta = Math.min(nextBeta, bestScore);

    if (nextBeta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function orderMoves(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  isMaximizing: boolean,
): SquareIndex[] {
  return legalMoves
    .map((move) => ({
      move,
      score: strategicEvaluateBoard(placeDisc(board, move, currentDisc), maximizingDisc),
    }))
    .sort((firstMove, secondMove) =>
      isMaximizing
        ? secondMove.score - firstMove.score
        : firstMove.score - secondMove.score,
    )
    .map(({ move }) => move);
}

function getFinalDiscDifference(board: Board, disc: DiscColor): number {
  const counts = countDiscs(board);
  const opponentDisc = getNextDisc(disc);

  return counts[disc] - counts[opponentDisc];
}

function compareCandidateScores(
  firstCandidate: CandidateMoveReview,
  secondCandidate: CandidateMoveReview,
): number {
  const scoreDifference = secondCandidate.score - firstCandidate.score;

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return firstCandidate.rank - secondCandidate.rank;
}
