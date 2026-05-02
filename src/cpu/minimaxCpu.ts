import {
  getLegalMoves,
  getNextDisc,
  isGameOver,
  placeDisc,
  type Board,
  type DiscColor,
} from "../game/othello";
import { strategicEvaluateBoard } from "./strategicEvaluateBoard";

const defaultSearchDepth = 3;

export function chooseMinimaxMove(
  board: Board,
  disc: DiscColor,
  searchDepth = defaultSearchDepth,
): number | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  let bestMove = legalMoves[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  let alpha = Number.NEGATIVE_INFINITY;

  for (const move of legalMoves) {
    const nextBoard = placeDisc(board, move, disc);
    const score = minimax(
      nextBoard,
      getNextDisc(disc),
      disc,
      searchDepth - 1,
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

    for (const move of legalMoves) {
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

  for (const move of legalMoves) {
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
