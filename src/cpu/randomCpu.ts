import { getLegalMoves, type Board, type DiscColor } from "../game/othello";

export function chooseRandomMove(
  board: Board,
  disc: DiscColor,
  random = Math.random,
): number | null {
  const legalMoves = getLegalMoves(board, disc);

  if (legalMoves.length === 0) {
    return null;
  }

  const moveIndex = Math.floor(random() * legalMoves.length);

  return legalMoves[moveIndex] ?? legalMoves[legalMoves.length - 1];
}
