import type { Board, DiscColor, SquareIndex } from "../../game/othello";
import {
  getMinimaxMoveScores,
  type MinimaxMoveScore,
} from "../search/minimaxSearch";

const defaultSearchDepth = 4;

export function chooseMinimaxMove(
  board: Board,
  disc: DiscColor,
  searchDepth = defaultSearchDepth,
): SquareIndex | null {
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
): SquareIndex | null {
  return chooseBestMove(getMinimaxMoveScores(board, disc, { searchDepth }));
}

function chooseBestMove(scores: MinimaxMoveScore[]): SquareIndex | null {
  return scores[0]?.move ?? null;
}
