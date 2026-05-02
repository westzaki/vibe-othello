import type { Board, DiscColor } from "../game/othello";
import { getMinimaxMoveScores, type MinimaxMoveScore } from "./minimaxSearch";

const defaultSearchDepth = 4;

export function chooseMinimaxMove(
  board: Board,
  disc: DiscColor,
  searchDepth = defaultSearchDepth,
): number | null {
  return chooseBestMove(
    getMinimaxMoveScores(board, disc, {
      searchDepth,
      useSelectiveDeepening: true,
    }),
  );
}

export function chooseFixedDepthMinimaxMove(
  board: Board,
  disc: DiscColor,
  searchDepth: number,
): number | null {
  return chooseBestMove(getMinimaxMoveScores(board, disc, { searchDepth }));
}

function chooseBestMove(scores: MinimaxMoveScore[]): number | null {
  return scores[0]?.move ?? null;
}
