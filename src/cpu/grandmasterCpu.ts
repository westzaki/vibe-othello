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
import { countEmptySquares } from "./evaluation/evaluationFeatures";
import { strategicEvaluateBoard } from "./evaluation/strategicEvaluateBoard";
import { getScoredMoves, orderMovesByScore } from "./moveSelection";

const grandmasterTimeLimitMs = 300;
const iterativeDeepeningMinDepth = 1;
const maxDeepCandidates = 6;
const minDeepCandidates = 3;
const candidatePruneScoreMargin = 45;
const fullWidthSearchDepth = 4;
const finalScoreWeight = 1000;

type ExactScoreCache = Map<string, number>;
type RootMoveScore = {
  move: SquareIndex;
  score: number;
};
type EndgameScore = {
  isExact: boolean;
  score: number;
};
type TimedSearchResult = {
  score: number;
  timedOut: boolean;
};

export function chooseGrandmasterMove(
  board: Board,
  disc: DiscColor,
): SquareIndex | null {
  return chooseIterativeDeepeningMove(board, disc);
}

export function chooseIterativeDeepeningMove(
  board: Board,
  disc: DiscColor,
  timeLimitMs = grandmasterTimeLimitMs,
): SquareIndex | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  const deadline = Date.now() + timeLimitMs;
  const initialScores = getScoredMoves(
    board,
    disc,
    (nextBoard) => strategicEvaluateBoard(nextBoard, disc),
    legalMoves,
  );
  let bestMove = orderMovesByScore(initialScores, "descending")[0];
  let previousScores = initialScores;
  const maxDepth = countEmptySquares(board);

  for (
    let depth = iterativeDeepeningMinDepth;
    depth <= maxDepth && Date.now() < deadline;
    depth += 1
  ) {
    const searchResult = searchRootMoves(
      board,
      disc,
      depth,
      getDeepeningCandidates(previousScores, depth),
      deadline,
    );

    if (searchResult.timedOut) {
      break;
    }

    previousScores = searchResult.scores;
    bestMove = orderMovesByScore(searchResult.scores, "descending")[0];
  }

  return bestMove;
}

function searchRootMoves(
  board: Board,
  disc: DiscColor,
  depth: number,
  candidateMoves: SquareIndex[],
  deadline: number,
): { scores: RootMoveScore[]; timedOut: boolean } {
  const scores: RootMoveScore[] = [];
  let alpha = Number.NEGATIVE_INFINITY;

  for (const move of candidateMoves) {
    if (Date.now() >= deadline) {
      return {
        scores,
        timedOut: true,
      };
    }

    const result = timedMinimax(
      placeDisc(board, move, disc),
      getNextDisc(disc),
      disc,
      depth - 1,
      alpha,
      Number.POSITIVE_INFINITY,
      deadline,
    );

    if (result.timedOut) {
      return {
        scores,
        timedOut: true,
      };
    }

    scores.push({
      move,
      score: result.score,
    });
    alpha = Math.max(alpha, result.score);
  }

  return {
    scores,
    timedOut: false,
  };
}

function timedMinimax(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
): TimedSearchResult {
  if (Date.now() >= deadline) {
    return {
      score: 0,
      timedOut: true,
    };
  }

  if (isGameOver(board)) {
    return {
      score: getFinalDiscDifference(board, maximizingDisc) * finalScoreWeight,
      timedOut: false,
    };
  }

  if (depth <= 0) {
    return {
      score: strategicEvaluateBoard(board, maximizingDisc),
      timedOut: false,
    };
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    return timedMinimax(
      board,
      nextDisc,
      maximizingDisc,
      depth - 1,
      alpha,
      beta,
      deadline,
    );
  }

  if (currentDisc === maximizingDisc) {
    return getTimedMaxScore(
      board,
      currentDisc,
      maximizingDisc,
      legalMoves,
      depth,
      alpha,
      beta,
      deadline,
    );
  }

  return getTimedMinScore(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    depth,
    alpha,
    beta,
    deadline,
  );
}

function getTimedMaxScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
): TimedSearchResult {
  let bestScore = Number.NEGATIVE_INFINITY;
  const orderedMoves = getOrderedMoves(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    true,
  );

  for (const move of orderedMoves) {
    const result = timedMinimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      alpha,
      beta,
      deadline,
    );

    if (result.timedOut) {
      return result;
    }

    bestScore = Math.max(bestScore, result.score);
    alpha = Math.max(alpha, bestScore);

    if (beta <= alpha) {
      break;
    }
  }

  return {
    score: bestScore,
    timedOut: false,
  };
}

function getTimedMinScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
): TimedSearchResult {
  let bestScore = Number.POSITIVE_INFINITY;
  const orderedMoves = getOrderedMoves(
    board,
    currentDisc,
    maximizingDisc,
    legalMoves,
    false,
  );

  for (const move of orderedMoves) {
    const result = timedMinimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      alpha,
      beta,
      deadline,
    );

    if (result.timedOut) {
      return result;
    }

    bestScore = Math.min(bestScore, result.score);
    beta = Math.min(beta, bestScore);

    if (beta <= alpha) {
      break;
    }
  }

  return {
    score: bestScore,
    timedOut: false,
  };
}

function getDeepeningCandidates(
  scores: RootMoveScore[],
  depth: number,
): SquareIndex[] {
  const sortedScores = [...scores].sort(
    (firstMove, secondMove) => secondMove.score - firstMove.score,
  );

  if (depth <= fullWidthSearchDepth) {
    return sortedScores.map(({ move }) => move);
  }

  const bestScore = sortedScores[0].score;
  const forcedCandidates = sortedScores
    .slice(0, minDeepCandidates)
    .map(({ move }) => move);
  const closeCandidates = sortedScores
    .filter(({ score }) => bestScore - score <= candidatePruneScoreMargin)
    .slice(0, maxDeepCandidates)
    .map(({ move }) => move);

  return Array.from(new Set([...forcedCandidates, ...closeCandidates]));
}

export function choosePerfectEndgameMove(
  board: Board,
  disc: DiscColor,
): SquareIndex | null {
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
    return solveEndgame(board, nextDisc, maximizingDisc, alpha, beta, cache);
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
  legalMoves: SquareIndex[],
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
  legalMoves: SquareIndex[],
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
  legalMoves: SquareIndex[],
  isMaximizing: boolean,
): SquareIndex[] {
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
