import {
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
} from "../game/othello";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";
import { countEmptySquares } from "./evaluationFeatures";
import { getScoredMoves, orderMovesByScore } from "./moveSelection";

const defaultSearchDepth = 4;
const endGameExtensionEmptyThreshold = 8;
const selectiveDeepeningExtraDepth = 2;
const selectiveDeepeningScoreMargin = 28;
const selectiveDeepeningMaxCandidates = 5;
const maxEvaluationCacheSize = 5000;

type RootMoveScore = {
  move: number;
  score: number;
};
const evaluationCache = new Map<string, number>();

export function chooseMinimaxMove(
  board: Board,
  disc: DiscColor,
  searchDepth = defaultSearchDepth,
): number | null {
  const rootMoveScores = getRootMoveScores(board, disc, searchDepth);

  if (rootMoveScores.length === 0) {
    return null;
  }

  const deepenedScores = getDeepenedRootMoveScores(
    board,
    disc,
    getSearchDepth(board, searchDepth),
    rootMoveScores,
  );

  return chooseBestRootMove(deepenedScores);
}

export function chooseFixedDepthMinimaxMove(
  board: Board,
  disc: DiscColor,
  searchDepth: number,
): number | null {
  return chooseBestRootMove(getRootMoveScores(board, disc, searchDepth));
}

function getRootMoveScores(
  board: Board,
  disc: DiscColor,
  searchDepth: number,
): RootMoveScore[] {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return [];
  }

  const orderedMoves = getOrderedMoves(board, disc, disc, legalMoves, true);
  const effectiveSearchDepth = getSearchDepth(board, searchDepth);
  const rootMoveScores: RootMoveScore[] = [];
  let alpha = Number.NEGATIVE_INFINITY;

  for (const move of orderedMoves) {
    const nextBoard = placeDisc(board, move, disc);
    const score = minimax(
      nextBoard,
      getNextDisc(disc),
      disc,
      effectiveSearchDepth - 1,
      alpha,
      Number.POSITIVE_INFINITY,
    );
    rootMoveScores.push({ move, score });
    alpha = Math.max(alpha, score);
  }

  return rootMoveScores;
}

function minimax(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth === 0 || isGameOver(board)) {
    return evaluateBoardWithCache(board, maximizingDisc);
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    const score = minimax(
      board,
      nextDisc,
      maximizingDisc,
      depth - 1,
      alpha,
      beta,
    );

    return score;
  }

  if (currentDisc === maximizingDisc) {
    let bestScore = Number.NEGATIVE_INFINITY;
    const orderedMoves = getOrderedMoves(
      board,
      currentDisc,
      maximizingDisc,
      legalMoves,
      true,
    );

    for (const move of orderedMoves) {
      const score = minimax(
        placeDisc(board, move, currentDisc),
        nextDisc,
        maximizingDisc,
        depth - 1,
        alpha,
        beta,
      );

      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);

      if (beta <= alpha) {
        break;
      }
    }

    return bestScore;
  }

  let bestScore = Number.POSITIVE_INFINITY;
  const orderedMoves = getOrderedMoves(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    false,
  );

  for (const move of orderedMoves) {
    const score = minimax(
      placeDisc(board, move, currentDisc),
      nextDisc,
      maximizingDisc,
      depth - 1,
      alpha,
      beta,
    );

    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);

    if (beta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function getDeepenedRootMoveScores(
  board: Board,
  disc: DiscColor,
  searchDepth: number,
  shallowScores: RootMoveScore[],
): RootMoveScore[] {
  if (searchDepth <= 1 || shallowScores.length <= 1) {
    return shallowScores;
  }

  const candidates = getSelectiveDeepeningCandidates(shallowScores);
  const deepSearchDepth = getDeepSearchDepth(board, searchDepth);
  const deepenedScores = new Map<number, number>();
  let alpha = Number.NEGATIVE_INFINITY;

  for (const { move } of candidates) {
    const score = minimax(
      placeDisc(board, move, disc),
      getNextDisc(disc),
      disc,
      deepSearchDepth - 1,
      alpha,
      Number.POSITIVE_INFINITY,
    );

    deepenedScores.set(move, score);
    alpha = Math.max(alpha, score);
  }

  return shallowScores.map(({ move, score }) => ({
    move,
    score: deepenedScores.get(move) ?? score,
  }));
}

function getSelectiveDeepeningCandidates(
  shallowScores: RootMoveScore[],
): RootMoveScore[] {
  const sortedScores = [...shallowScores].sort(
    (firstMove, secondMove) => secondMove.score - firstMove.score,
  );
  const bestScore = sortedScores[0].score;

  return sortedScores
    .filter(({ score }) => bestScore - score <= selectiveDeepeningScoreMargin)
    .slice(0, selectiveDeepeningMaxCandidates);
}

function chooseBestRootMove(scores: RootMoveScore[]): number | null {
  if (scores.length === 0) {
    return null;
  }

  return scores.reduce((bestScore, score) =>
    score.score > bestScore.score ? score : bestScore,
  ).move;
}

function getOrderedMoves(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: number[],
  isMaximizing: boolean,
): number[] {
  return orderMovesByScore(
    getScoredMoves(
      board,
      currentDisc,
      (nextBoard) => strategicEvaluateBoard(nextBoard, maximizingDisc),
      legalMoves,
    ),
    isMaximizing ? "descending" : "ascending",
  );
}

function getSearchDepth(board: Board, requestedDepth: number): number {
  const emptyCount = countEmptySquares(board);

  if (emptyCount <= endGameExtensionEmptyThreshold) {
    return Math.max(requestedDepth, emptyCount);
  }

  return requestedDepth;
}

function getDeepSearchDepth(board: Board, searchDepth: number): number {
  return getSearchDepth(board, searchDepth + selectiveDeepeningExtraDepth);
}

function evaluateBoardWithCache(board: Board, disc: DiscColor): number {
  const cacheKey = getEvaluationCacheKey(board, disc);
  const cachedScore = evaluationCache.get(cacheKey);

  if (cachedScore !== undefined) {
    return cachedScore;
  }

  const score = strategicEvaluateBoard(board, disc);

  if (evaluationCache.size >= maxEvaluationCacheSize) {
    evaluationCache.clear();
  }

  evaluationCache.set(cacheKey, score);

  return score;
}

function getEvaluationCacheKey(board: Board, disc: DiscColor): string {
  return `${disc}:${board
    .map((cell) => cell?.[0] ?? "-")
    .join("")}`;
}
