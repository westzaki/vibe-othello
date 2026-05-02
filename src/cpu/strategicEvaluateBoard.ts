import {
  countDiscs,
  getLegalMoves,
  getNextDisc,
  type Board,
  type DiscColor,
} from "../game/othello";

const boardWeights = [
  100, -25, 10, 5, 5, 10, -25, 100, -25, -40, -5, -5, -5, -5, -40, -25, 10, -5,
  3, 2, 2, 3, -5, 10, 5, -5, 2, 1, 1, 2, -5, 5, 5, -5, 2, 1, 1, 2, -5, 5, 10,
  -5, 3, 2, 2, 3, -5, 10, -25, -40, -5, -5, -5, -5, -40, -25, 100, -25, 10, 5,
  5, 10, -25, 100,
];
const cornerSquares = [0, 7, 56, 63];
const mobilityWeight = 6;
const cornerWeight = 35;
const discCountWeight = 0.25;

export function strategicEvaluateBoard(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);
  const counts = countDiscs(board);
  const boardWeightScore = getBoardWeightScore(board, disc);
  const mobilityScore =
    (getLegalMoves(board, disc).length -
      getLegalMoves(board, opponentDisc).length) *
    mobilityWeight;
  const cornerScore = getCornerDifference(board, disc) * cornerWeight;
  const discCountScore =
    (counts[disc] - counts[opponentDisc]) * discCountWeight;

  return boardWeightScore + mobilityScore + cornerScore + discCountScore;
}

function getBoardWeightScore(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);

  return board.reduce((score, cell, index) => {
    if (cell === disc) {
      return score + boardWeights[index];
    }

    if (cell === opponentDisc) {
      return score - boardWeights[index];
    }

    return score;
  }, 0);
}

function getCornerDifference(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);

  return cornerSquares.reduce((difference, square) => {
    if (board[square] === disc) {
      return difference + 1;
    }

    if (board[square] === opponentDisc) {
      return difference - 1;
    }

    return difference;
  }, 0);
}
