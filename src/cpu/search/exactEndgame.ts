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
export type ExactEndgameMoveScore = {
  move: SquareIndex;
  score: number;
};
export type ExactEndgameMoveOrderer = (context: {
  board: Board;
  currentDisc: DiscColor;
  scoringDisc: DiscColor;
  legalMoves: SquareIndex[];
  isMaximizing: boolean;
}) => SquareIndex[];
export type ExactEndgameMoveOptions = {
  orderedMoves?: SquareIndex[];
  orderMoves?: ExactEndgameMoveOrderer;
};
type EndgameScore = {
  isExact: boolean;
  score: number;
};

export function chooseExactEndgameMove(
  board: Board,
  disc: DiscColor,
  options: ExactEndgameMoveOptions = {},
): SquareIndex | null {
  const scores = getExactEndgameMoveScores(board, disc, options);

  return scores[0]?.move ?? null;
}

export function getExactEndgameMoveScores(
  board: Board,
  disc: DiscColor,
  options: ExactEndgameMoveOptions = {},
): ExactEndgameMoveScore[] {
  const cache: ExactScoreCache = new Map();
  const orderedMoves = options.orderedMoves ?? getLegalMoves(board, disc);

  return orderedMoves
    .map((move) => {
      const result = solveEndgame(
        placeDisc(board, move, disc),
        getNextDisc(disc),
        disc,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        cache,
        options.orderMoves ?? null,
      );

      return {
        move,
        score: result.score,
      };
    })
    .sort((firstMove, secondMove) => secondMove.score - firstMove.score);
}

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
    null,
  ).score;
}

function solveEndgame(
  board: Board,
  currentDisc: DiscColor,
  scoringDisc: DiscColor,
  alpha: number,
  beta: number,
  cache: ExactScoreCache,
  orderMoves: ExactEndgameMoveOrderer | null,
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
      orderMoves,
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
          orderMoves,
        )
      : getMinScore(
          board,
          currentDisc,
          scoringDisc,
          legalMoves,
          alpha,
          beta,
          cache,
          orderMoves,
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
  orderMoves: ExactEndgameMoveOrderer | null,
): EndgameScore {
  let bestScore = Number.NEGATIVE_INFINITY;
  let isExact = true;
  let nextAlpha = alpha;
  const moves = orderMoves?.({
    board,
    currentDisc,
    scoringDisc,
    legalMoves,
    isMaximizing: true,
  }) ?? legalMoves;

  for (const move of moves) {
    const result = solveEndgame(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      scoringDisc,
      nextAlpha,
      beta,
      cache,
      orderMoves,
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
  orderMoves: ExactEndgameMoveOrderer | null,
): EndgameScore {
  let bestScore = Number.POSITIVE_INFINITY;
  let isExact = true;
  let nextBeta = beta;
  const moves = orderMoves?.({
    board,
    currentDisc,
    scoringDisc,
    legalMoves,
    isMaximizing: false,
  }) ?? legalMoves;

  for (const move of moves) {
    const result = solveEndgame(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      scoringDisc,
      alpha,
      nextBeta,
      cache,
      orderMoves,
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
