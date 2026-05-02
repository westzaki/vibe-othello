import {
  countDiscs,
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
} from "../game/othello";
import { countEmptySquares } from "./evaluationFeatures";
import { chooseMinimaxMove } from "./minimaxCpu";
import { getScoredMoves, orderMovesByScore } from "./moveSelection";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";

const perfectEndgameEmptyThreshold = 12;

type ExactScoreCache = Map<string, number>;
type EndgameScore = {
  isExact: boolean;
  score: number;
};

export function chooseGrandmasterMove(
  board: Board,
  disc: DiscColor,
): number | null {
  if (countEmptySquares(board) <= perfectEndgameEmptyThreshold) {
    return choosePerfectEndgameMove(board, disc);
  }

  return chooseMinimaxMove(board, disc);
}

export function choosePerfectEndgameMove(
  board: Board,
  disc: DiscColor,
): number | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  const orderedMoves = getOrderedMoves(board, disc, disc, legalMoves, true);
  const cache: ExactScoreCache = new Map();
  let bestMove = orderedMoves[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  let alpha = Number.NEGATIVE_INFINITY;

  for (const move of orderedMoves) {
    const score = solveEndgame(
      placeDisc(board, move, disc),
      getNextDisc(disc),
      disc,
      alpha,
      Number.POSITIVE_INFINITY,
      cache,
    );

    if (score > bestScore) {
      bestMove = move;
      bestScore = score;
    }

    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}

function solveEndgame(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  alpha: number,
  beta: number,
  cache: ExactScoreCache,
): number {
  const cacheKey = getExactScoreCacheKey(board, currentDisc, maximizingDisc);
  const cachedScore = cache.get(cacheKey);

  if (cachedScore !== undefined) {
    return cachedScore;
  }

  if (isGameOver(board)) {
    const score = getFinalDiscDifference(board, maximizingDisc);

    cache.set(cacheKey, score);

    return score;
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    return solveEndgame(
      board,
      nextDisc,
      maximizingDisc,
      alpha,
      beta,
      cache,
    );
  }

  if (currentDisc === maximizingDisc) {
    const result = getMaxScore(
      board,
      currentDisc,
      maximizingDisc,
      legalMoves,
      alpha,
      beta,
      cache,
    );

    if (result.isExact) {
      cache.set(cacheKey, result.score);
    }

    return result.score;
  }

  const result = getMinScore(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    alpha,
    beta,
    cache,
  );

  if (result.isExact) {
    cache.set(cacheKey, result.score);
  }

  return result.score;
}

function getMaxScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: number[],
  alpha: number,
  beta: number,
  cache: ExactScoreCache,
): EndgameScore {
  let bestScore = Number.NEGATIVE_INFINITY;
  let isExact = true;
  const orderedMoves = getOrderedMoves(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    true,
  );

  for (const move of orderedMoves) {
    const score = solveEndgame(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      alpha,
      beta,
      cache,
    );

    bestScore = Math.max(bestScore, score);
    alpha = Math.max(alpha, bestScore);

    if (beta <= alpha) {
      isExact = false;
      break;
    }
  }

  return {
    isExact,
    score: bestScore,
  };
}

function getMinScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: number[],
  alpha: number,
  beta: number,
  cache: ExactScoreCache,
): EndgameScore {
  let bestScore = Number.POSITIVE_INFINITY;
  let isExact = true;
  const orderedMoves = getOrderedMoves(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    false,
  );

  for (const move of orderedMoves) {
    const score = solveEndgame(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      alpha,
      beta,
      cache,
    );

    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);

    if (beta <= alpha) {
      isExact = false;
      break;
    }
  }

  return {
    isExact,
    score: bestScore,
  };
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

function getFinalDiscDifference(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);
  const counts = countDiscs(board);

  return counts[disc] - counts[opponentDisc];
}

function getExactScoreCacheKey(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
): string {
  return `${currentDisc}:${maximizingDisc}:${board
    .map((cell) => cell?.[0] ?? "-")
    .join("")}`;
}
