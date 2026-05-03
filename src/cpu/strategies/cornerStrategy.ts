import {
  CORNER_SQUARES,
  getLegalMoves,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../../game/othello";
import { chooseRandomMove } from "./randomStrategy";

export function chooseCornerMove(
  board: Board,
  disc: DiscColor,
  random = Math.random,
): SquareIndex | null {
  const legalMoves = getLegalMoves(board, disc);
  const cornerMove = CORNER_SQUARES.find((square) =>
    legalMoves.includes(square),
  );

  if (cornerMove !== undefined) {
    return cornerMove;
  }

  return chooseRandomMove(board, disc, random);
}
