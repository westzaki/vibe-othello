import {
  countDiscs,
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../../game/othello";

type ExactScoreCache = Map<string, number>;
type EndgameScore = {
  isExact: boolean;
  score: number;
};

export function solveExactEndgameDiscDifference(
  board: Board,
  currentDisc: DiscColor,
  scoringDisc: DiscColor,
): number {
  return solveEndgame(
    board,
    currentDisc,
    scoringDisc,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    new Map(),
  ).score;
}

function solveEndgame(
  board: Board,
  currentDisc: DiscColor,
  scoringDisc: DiscColor,
  alpha: number,
  beta: number,
  cache: ExactScoreCache,
): EndgameScore {
  const cacheKey = getCacheKey(board, currentDisc, scoringDisc);
  const cachedScore = cache.get(cacheKey);

  if (cachedScore !== undefined) {
    return {
      isExact: true,
      score: cachedScore,
    };
  }

  if (isGameOver(board)) {
    const score = getDiscDifference(board, scoringDisc);

    cache.set(cacheKey, score);

    return {
      isExact: true,
      score,
    };
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    const result = solveEndgame(
      board,
      nextDisc,
      scoringDisc,
      alpha,
      beta,
      cache,
    );

    if (result.isExact) {
      cache.set(cacheKey, result.score);
    }

    return result;
  }

  const result =
    currentDisc === scoringDisc
      ? getMaxScore(
          board,
          currentDisc,
          scoringDisc,
          legalMoves,
          alpha,
          beta,
          cache,
        )
      : getMinScore(
          board,
          currentDisc,
          scoringDisc,
          legalMoves,
          alpha,
          beta,
          cache,
        );

  if (result.isExact) {
    cache.set(cacheKey, result.score);
  }

  return result;
}

function getMaxScore(
  board: Board,
  currentDisc: DiscColor,
  scoringDisc: DiscColor,
  legalMoves: SquareIndex[],
  alpha: number,
  beta: number,
  cache: ExactScoreCache,
): EndgameScore {
  let bestScore = Number.NEGATIVE_INFINITY;
  let isExact = true;
  let nextAlpha = alpha;

  for (const move of legalMoves) {
    const result = solveEndgame(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      scoringDisc,
      nextAlpha,
      beta,
      cache,
    );

    if (!result.isExact) {
      isExact = false;
    }

    bestScore = Math.max(bestScore, result.score);
    nextAlpha = Math.max(nextAlpha, bestScore);

    if (beta <= nextAlpha) {
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
  scoringDisc: DiscColor,
  legalMoves: SquareIndex[],
  alpha: number,
  beta: number,
  cache: ExactScoreCache,
): EndgameScore {
  let bestScore = Number.POSITIVE_INFINITY;
  let isExact = true;
  let nextBeta = beta;

  for (const move of legalMoves) {
    const result = solveEndgame(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      scoringDisc,
      alpha,
      nextBeta,
      cache,
    );

    if (!result.isExact) {
      isExact = false;
    }

    bestScore = Math.min(bestScore, result.score);
    nextBeta = Math.min(nextBeta, bestScore);

    if (nextBeta <= alpha) {
      isExact = false;
      break;
    }
  }

  return {
    isExact,
    score: bestScore,
  };
}

function getDiscDifference(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);
  const counts = countDiscs(board);

  return counts[disc] - counts[opponentDisc];
}

function getCacheKey(
  board: Board,
  currentDisc: DiscColor,
  scoringDisc: DiscColor,
): string {
  return `${currentDisc}:${scoringDisc}:${board
    .map((cell) => cell?.[0] ?? "-")
    .join("")}`;
}
