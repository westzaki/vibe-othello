import {
  countDiscs,
  getNextDisc,
  type Board,
  type DiscColor,
} from "../game/othello";

const cornerSquares = [0, 7, 56, 63];
const cornerScore = 25;

export function evaluateBoard(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);
  const counts = countDiscs(board);
  let score = counts[disc] - counts[opponentDisc];

  for (const square of cornerSquares) {
    if (board[square] === disc) {
      score += cornerScore;
    }

    if (board[square] === opponentDisc) {
      score -= cornerScore;
    }
  }

  return score;
}
