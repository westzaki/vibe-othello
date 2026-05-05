import { strategicEvaluateBoard } from "../cpu";
import {
  CORNER_SQUARES,
  countDiscs,
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";

export type TeacherGuidanceSearchStats = {
  cacheHitCount: number;
  searchedNodeCount: number;
};

export type TeacherSearchContext = {
  cache: Map<string, number>;
  cacheHitCount: number;
  maxCacheEntries: number;
  searchedNodeCount: number;
  stats?: TeacherGuidanceSearchStats;
};

type TeacherSearchResult = {
  isExact: boolean;
  score: number;
};

const teacherSearchCacheMaxEntries = 20_000;
const teacherMoveOrderingCornerBonus = 140;
const teacherMoveOrderingCornerAccessPenalty = 90;
const teacherMoveOrderingDangerSquarePenalty = 32;
const teacherMoveOrderingMobilityDeltaWeight = 8;
const teacherMoveOrderingAnchoredEdgeBonus = 18;
const finalScoreWeight = 1000;
const teacherDangerSquaresByCorner = new Map<SquareIndex, SquareIndex[]>([
  [0, [1, 8, 9]],
  [7, [6, 14, 15]],
  [56, [48, 49, 57]],
  [63, [54, 55, 62]],
]);
const teacherEdgeRaysByCorner: Array<{
  corner: SquareIndex;
  directions: [number, number];
}> = [
  { corner: 0, directions: [1, 8] },
  { corner: 7, directions: [-1, 8] },
  { corner: 56, directions: [1, -8] },
  { corner: 63, directions: [-1, -8] },
];

export function createTeacherSearchContext(
  stats?: TeacherGuidanceSearchStats,
): TeacherSearchContext {
  if (stats !== undefined) {
    stats.cacheHitCount = 0;
    stats.searchedNodeCount = 0;
  }

  return {
    cache: new Map(),
    cacheHitCount: 0,
    maxCacheEntries: teacherSearchCacheMaxEntries,
    searchedNodeCount: 0,
    stats,
  };
}

export function evaluateTeacherSearchPosition({
  alpha = Number.NEGATIVE_INFINITY,
  beta = Number.POSITIVE_INFINITY,
  board,
  currentDisc,
  depth,
  maximizingDisc,
  searchContext = createTeacherSearchContext(),
}: {
  alpha?: number;
  beta?: number;
  board: Board;
  currentDisc: DiscColor;
  depth: number;
  maximizingDisc: DiscColor;
  searchContext?: TeacherSearchContext;
}): number {
  return minimax(
    board,
    currentDisc,
    maximizingDisc,
    depth,
    alpha,
    beta,
    searchContext,
  ).score;
}

export function orderTeacherSearchMoves({
  board,
  currentDisc,
  isMaximizing,
  legalMoves,
  maximizingDisc,
  remainingDepth,
}: {
  board: Board;
  currentDisc: DiscColor;
  isMaximizing: boolean;
  legalMoves: SquareIndex[];
  maximizingDisc: DiscColor;
  remainingDepth?: number;
}): SquareIndex[] {
  if (remainingDepth !== undefined && remainingDepth <= 2) {
    return orderTeacherSearchMovesByStrategicEvaluation({
      board,
      currentDisc,
      isMaximizing,
      legalMoves,
      maximizingDisc,
    });
  }

  const opponentDisc = getNextDisc(currentDisc);
  const opponentCornerMovesBefore = getCornerMoveCount(board, opponentDisc);
  const opponentMobilityBefore = getLegalMoves(board, opponentDisc).length;
  const anchoredEdgeDifferenceBefore = getAnchoredEdgeDifference(
    board,
    currentDisc,
  );

  return legalMoves
    .map((move) => ({
      move,
      score: getTeacherMoveOrderingScore({
        anchoredEdgeDifferenceBefore,
        board,
        currentDisc,
        maximizingDisc,
        move,
        opponentCornerMovesBefore,
        opponentMobilityBefore,
      }),
    }))
    .sort((firstMove, secondMove) =>
      isMaximizing
        ? secondMove.score - firstMove.score
        : firstMove.score - secondMove.score,
    )
    .map(({ move }) => move);
}

function minimax(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  depth: number,
  alpha: number,
  beta: number,
  searchContext: TeacherSearchContext,
): TeacherSearchResult {
  const cacheKey = createTeacherSearchCacheKey({
    board,
    currentDisc,
    depth,
    maximizingDisc,
  });
  const cachedScore = searchContext.cache.get(cacheKey);

  if (cachedScore !== undefined) {
    recordTeacherSearchCacheHit(searchContext);

    return {
      isExact: true,
      score: cachedScore,
    };
  }

  recordTeacherSearchNode(searchContext);

  if (isGameOver(board)) {
    return cacheTeacherSearchResult(searchContext, cacheKey, {
      isExact: true,
      score: getFinalDiscDifference(board, maximizingDisc) * finalScoreWeight,
    });
  }

  if (depth <= 0) {
    return cacheTeacherSearchResult(searchContext, cacheKey, {
      isExact: true,
      score: strategicEvaluateBoard(board, maximizingDisc),
    });
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    const result = minimax(
      board,
      nextDisc,
      maximizingDisc,
      depth - 1,
      alpha,
      beta,
      searchContext,
    );

    return cacheTeacherSearchResult(searchContext, cacheKey, result);
  }

  const result =
    currentDisc === maximizingDisc
      ? getMaxScore(
          board,
          currentDisc,
          maximizingDisc,
          legalMoves,
          depth,
          alpha,
          beta,
          searchContext,
        )
      : getMinScore(
          board,
          currentDisc,
          maximizingDisc,
          legalMoves,
          depth,
          alpha,
          beta,
          searchContext,
        );

  return cacheTeacherSearchResult(searchContext, cacheKey, result);
}

function getMaxScore(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: SquareIndex[],
  depth: number,
  alpha: number,
  beta: number,
  searchContext: TeacherSearchContext,
): TeacherSearchResult {
  let bestScore = Number.NEGATIVE_INFINITY;
  let nextAlpha = alpha;
  let isExact = true;

  for (const move of orderTeacherSearchMoves({
    board,
    currentDisc,
    isMaximizing: true,
    legalMoves,
    maximizingDisc,
    remainingDepth: depth,
  })) {
    const result = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      nextAlpha,
      beta,
      searchContext,
    );
    const score = result.score;

    isExact &&= result.isExact;
    bestScore = Math.max(bestScore, score);
    nextAlpha = Math.max(nextAlpha, bestScore);

    if (beta <= nextAlpha) {
      return {
        isExact: false,
        score: bestScore,
      };
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
  depth: number,
  alpha: number,
  beta: number,
  searchContext: TeacherSearchContext,
): TeacherSearchResult {
  let bestScore = Number.POSITIVE_INFINITY;
  let nextBeta = beta;
  let isExact = true;

  for (const move of orderTeacherSearchMoves({
    board,
    currentDisc,
    isMaximizing: false,
    legalMoves,
    maximizingDisc,
    remainingDepth: depth,
  })) {
    const result = minimax(
      placeDisc(board, move, currentDisc),
      getNextDisc(currentDisc),
      maximizingDisc,
      depth - 1,
      alpha,
      nextBeta,
      searchContext,
    );
    const score = result.score;

    isExact &&= result.isExact;
    bestScore = Math.min(bestScore, score);
    nextBeta = Math.min(nextBeta, bestScore);

    if (nextBeta <= alpha) {
      return {
        isExact: false,
        score: bestScore,
      };
    }
  }

  return {
    isExact,
    score: bestScore,
  };
}

function orderTeacherSearchMovesByStrategicEvaluation({
  board,
  currentDisc,
  isMaximizing,
  legalMoves,
  maximizingDisc,
}: {
  board: Board;
  currentDisc: DiscColor;
  isMaximizing: boolean;
  legalMoves: SquareIndex[];
  maximizingDisc: DiscColor;
}): SquareIndex[] {
  return legalMoves
    .map((move) => ({
      move,
      score: strategicEvaluateBoard(
        placeDisc(board, move, currentDisc),
        maximizingDisc,
      ),
    }))
    .sort((firstMove, secondMove) =>
      isMaximizing
        ? secondMove.score - firstMove.score
        : firstMove.score - secondMove.score,
    )
    .map(({ move }) => move);
}

function getTeacherMoveOrderingScore({
  anchoredEdgeDifferenceBefore,
  board,
  currentDisc,
  maximizingDisc,
  move,
  opponentCornerMovesBefore,
  opponentMobilityBefore,
}: {
  anchoredEdgeDifferenceBefore: number;
  board: Board;
  currentDisc: DiscColor;
  maximizingDisc: DiscColor;
  move: SquareIndex;
  opponentCornerMovesBefore: number;
  opponentMobilityBefore: number;
}): number {
  const boardAfterMove = placeDisc(board, move, currentDisc);
  const opponentDisc = getNextDisc(currentDisc);
  const opponentMovesAfter = getLegalMoves(boardAfterMove, opponentDisc);
  const opponentCornerMovesAfter = opponentMovesAfter.filter(isCorner).length;
  const opponentCornerMoveDelta =
    opponentCornerMovesAfter - opponentCornerMovesBefore;
  const opponentMobilityDelta =
    opponentMovesAfter.length - opponentMobilityBefore;
  const anchoredEdgeDelta =
    getAnchoredEdgeDifference(boardAfterMove, currentDisc) -
    anchoredEdgeDifferenceBefore;
  const moverScore =
    (isCorner(move) ? teacherMoveOrderingCornerBonus : 0) -
    Math.max(0, opponentCornerMoveDelta) *
      teacherMoveOrderingCornerAccessPenalty -
    (isDangerSquare(board, move) ? teacherMoveOrderingDangerSquarePenalty : 0) -
    opponentMobilityDelta * teacherMoveOrderingMobilityDeltaWeight +
    anchoredEdgeDelta * teacherMoveOrderingAnchoredEdgeBonus;
  const moverSign = currentDisc === maximizingDisc ? 1 : -1;

  return (
    strategicEvaluateBoard(boardAfterMove, maximizingDisc) +
    moverScore * moverSign
  );
}

function cacheTeacherSearchResult(
  searchContext: TeacherSearchContext,
  cacheKey: string,
  result: TeacherSearchResult,
): TeacherSearchResult {
  if (
    result.isExact &&
    searchContext.cache.size < searchContext.maxCacheEntries
  ) {
    searchContext.cache.set(cacheKey, result.score);
  }

  return result;
}

function createTeacherSearchCacheKey({
  board,
  currentDisc,
  depth,
  maximizingDisc,
}: {
  board: Board;
  currentDisc: DiscColor;
  depth: number;
  maximizingDisc: DiscColor;
}): string {
  return `${depth}:${currentDisc}:${maximizingDisc}:${board
    .map((cell) => {
      if (cell === "black") {
        return "b";
      }

      if (cell === "white") {
        return "w";
      }

      return "-";
    })
    .join("")}`;
}

function recordTeacherSearchCacheHit(
  searchContext: TeacherSearchContext,
): void {
  searchContext.cacheHitCount += 1;

  if (searchContext.stats !== undefined) {
    searchContext.stats.cacheHitCount = searchContext.cacheHitCount;
  }
}

function recordTeacherSearchNode(searchContext: TeacherSearchContext): void {
  searchContext.searchedNodeCount += 1;

  if (searchContext.stats !== undefined) {
    searchContext.stats.searchedNodeCount = searchContext.searchedNodeCount;
  }
}

function getCornerMoveCount(board: Board, disc: DiscColor): number {
  return getLegalMoves(board, disc).filter(isCorner).length;
}

function isCorner(square: SquareIndex): boolean {
  return (CORNER_SQUARES as readonly SquareIndex[]).includes(square);
}

function isDangerSquare(board: Board, square: SquareIndex): boolean {
  for (const [corner, dangerSquares] of teacherDangerSquaresByCorner) {
    if (board[corner] === null && dangerSquares.includes(square)) {
      return true;
    }
  }

  return false;
}

function getAnchoredEdgeDifference(board: Board, disc: DiscColor): number {
  return (
    getAnchoredEdgeCount(board, disc) -
    getAnchoredEdgeCount(board, getNextDisc(disc))
  );
}

function getAnchoredEdgeCount(board: Board, disc: DiscColor): number {
  return teacherEdgeRaysByCorner.reduce<number>(
    (count, { corner, directions }) =>
      count +
      directions.reduce<number>(
        (rayCount, direction) =>
          rayCount + getAnchoredEdgeRayCount(board, disc, corner, direction),
        0,
      ),
    0,
  );
}

function getAnchoredEdgeRayCount(
  board: Board,
  disc: DiscColor,
  corner: SquareIndex,
  direction: number,
): number {
  if (board[corner] !== disc) {
    return 0;
  }

  let count = 1;
  let square = corner + direction;

  while (isEdgeRaySquare(corner, direction, square) && board[square] === disc) {
    count += 1;
    square += direction;
  }

  return count;
}

function isEdgeRaySquare(
  corner: SquareIndex,
  direction: number,
  square: SquareIndex,
): boolean {
  if (square < 0 || square >= 64) {
    return false;
  }

  if (direction === 1 || direction === -1) {
    return Math.floor(square / 8) === Math.floor(corner / 8);
  }

  return square % 8 === corner % 8;
}

function getFinalDiscDifference(board: Board, disc: DiscColor): number {
  const counts = countDiscs(board);
  const opponentDisc = getNextDisc(disc);

  return counts[disc] - counts[opponentDisc];
}
