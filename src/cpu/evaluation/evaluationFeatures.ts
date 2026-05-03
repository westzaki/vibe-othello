import {
  CORNER_SQUARES,
  countDiscs,
  getLegalMoves,
  getNextDisc,
  type Board,
  type DiscColor,
} from "../../game/othello";

export function countEmptySquares(board: Board): number {
  return board.filter((cell) => cell === null).length;
}

export function getCornerDifference(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);

  return CORNER_SQUARES.reduce<number>((difference, square) => {
    if (board[square] === disc) {
      return difference + 1;
    }

    if (board[square] === opponentDisc) {
      return difference - 1;
    }

    return difference;
  }, 0);
}

export function getDiscCountDifference(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);
  const counts = countDiscs(board);

  return counts[disc] - counts[opponentDisc];
}

export function getMobilityDifference(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);

  return (
    getLegalMoves(board, disc).length -
    getLegalMoves(board, opponentDisc).length
  );
}
