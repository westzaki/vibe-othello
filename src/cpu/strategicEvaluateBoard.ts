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
const middleGameMobilityWeight = 6;
const endGameMobilityWeight = 2;
const cornerWeight = 35;
const middleGameDiscCountWeight = 0.25;
const endGameDiscCountWeight = 3;
const endGameEmptyThreshold = 12;

export function strategicEvaluateBoard(board: Board, disc: DiscColor): number {
  const opponentDisc = getNextDisc(disc);
  const counts = countDiscs(board);
  const emptyCount = countEmptySquares(board);
  const boardWeightScore = getBoardWeightScore(board, disc);
  const mobilityScore =
    (getLegalMoves(board, disc).length -
      getLegalMoves(board, opponentDisc).length) *
    getMobilityWeight(emptyCount);
  const cornerScore = getCornerDifference(board, disc) * cornerWeight;
  const discCountScore =
    (counts[disc] - counts[opponentDisc]) * getDiscCountWeight(emptyCount);

  return boardWeightScore + mobilityScore + cornerScore + discCountScore;
}

function countEmptySquares(board: Board): number {
  return board.filter((cell) => cell === null).length;
}

function getMobilityWeight(emptyCount: number): number {
  return emptyCount <= endGameEmptyThreshold
    ? endGameMobilityWeight
    : middleGameMobilityWeight;
}

function getDiscCountWeight(emptyCount: number): number {
  return emptyCount <= endGameEmptyThreshold
    ? endGameDiscCountWeight
    : middleGameDiscCountWeight;
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
