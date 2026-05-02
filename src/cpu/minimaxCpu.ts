import {
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
} from "../game/othello";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";

const defaultSearchDepth = 4;
const endGameExtensionEmptyThreshold = 8;

export function chooseMinimaxMove(
  board: Board,
  disc: DiscColor,
  searchDepth = defaultSearchDepth,
): number | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  const orderedMoves = getOrderedMoves(board, disc, disc, legalMoves, true);
  const effectiveSearchDepth = getSearchDepth(board, searchDepth);
  let bestMove = orderedMoves[0];
  let bestScore = Number.NEGATIVE_INFINITY;
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

    if (score > bestScore) {
      bestMove = move;
      bestScore = score;
    }

    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
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
    return strategicEvaluateBoard(board, maximizingDisc);
  }

  const legalMoves = getLegalMoves(board, currentDisc);
  const nextDisc = getNextDisc(currentDisc);

  if (legalMoves.length === 0) {
    return minimax(board, nextDisc, maximizingDisc, depth - 1, alpha, beta);
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

function getOrderedMoves(
  board: Board,
  currentDisc: DiscColor,
  maximizingDisc: DiscColor,
  legalMoves: number[],
  isMaximizing: boolean,
): number[] {
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

function getSearchDepth(board: Board, requestedDepth: number): number {
  const emptyCount = board.filter((cell) => cell === null).length;

  if (emptyCount <= endGameExtensionEmptyThreshold) {
    return Math.max(requestedDepth, emptyCount);
  }

  return requestedDepth;
}
