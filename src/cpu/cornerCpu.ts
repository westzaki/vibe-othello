import { getLegalMoves, type Board, type DiscColor } from "../game/othello";
import { chooseRandomMove } from "./randomCpu";

const cornerSquares = [0, 7, 56, 63];

export function chooseCornerMove(
  board: Board,
  disc: DiscColor,
  random = Math.random,
): number | null {
  const legalMoves = getLegalMoves(board, disc);
  const cornerMove = cornerSquares.find((square) =>
    legalMoves.includes(square),
  );

  if (cornerMove !== undefined) {
    return cornerMove;
  }

  return chooseRandomMove(board, disc, random);
}
