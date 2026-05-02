export type DiscColor = "black" | "white";
export type Cell = DiscColor | null;
export type SquareIndex = number;
export type Board = Cell[];
export type DiscCounts = Record<DiscColor, number>;
export type Winner = DiscColor | "draw";
export type AppliedMove = {
  board: Board;
  flippedSquares: SquareIndex[];
};

export const BOARD_SIZE = 8;
export const SQUARE_COUNT = BOARD_SIZE * BOARD_SIZE;
export const CORNER_SQUARES = [0, 7, 56, 63] as const;
const directions = [
  { row: -1, column: -1 },
  { row: -1, column: 0 },
  { row: -1, column: 1 },
  { row: 0, column: -1 },
  { row: 0, column: 1 },
  { row: 1, column: -1 },
  { row: 1, column: 0 },
  { row: 1, column: 1 },
];

export function createEmptyBoard(): Board {
  return Array.from({ length: SQUARE_COUNT }, () => null);
}

export function createInitialBoard(): Board {
  const board = createEmptyBoard();

  board[getIndex(3, 3)] = "white";
  board[getIndex(3, 4)] = "black";
  board[getIndex(4, 3)] = "black";
  board[getIndex(4, 4)] = "white";

  return board;
}

export function getNextDisc(disc: DiscColor): DiscColor {
  return disc === "black" ? "white" : "black";
}

export function isLegalMove(
  board: Board,
  index: SquareIndex,
  disc: DiscColor,
): boolean {
  if (board[index] !== null) {
    return false;
  }

  return directions.some(
    (direction) => getDiscsToFlip(board, index, disc, direction).length > 0,
  );
}

export function getLegalMoves(board: Board, disc: DiscColor): SquareIndex[] {
  return board.flatMap((_, index) =>
    isLegalMove(board, index, disc) ? [index] : [],
  );
}

export function getFlippedSquares(
  board: Board,
  index: SquareIndex,
  disc: DiscColor,
): SquareIndex[] {
  if (board[index] !== null) {
    return [];
  }

  return directions.flatMap((direction) =>
    getDiscsToFlip(board, index, disc, direction),
  );
}

export function hasLegalMove(board: Board, disc: DiscColor): boolean {
  return board.some((_, index) => isLegalMove(board, index, disc));
}

export function isGameOver(board: Board): boolean {
  return !hasLegalMove(board, "black") && !hasLegalMove(board, "white");
}

export function countDiscs(board: Board): DiscCounts {
  return board.reduce<DiscCounts>(
    (counts, cell) => {
      if (cell !== null) {
        counts[cell] += 1;
      }

      return counts;
    },
    { black: 0, white: 0 },
  );
}

export function getWinner(board: Board): Winner {
  const counts = countDiscs(board);

  if (counts.black > counts.white) {
    return "black";
  }

  if (counts.white > counts.black) {
    return "white";
  }

  return "draw";
}

export function placeDisc(board: Board, index: number, disc: DiscColor): Board {
  return applyMove(board, index, disc)?.board ?? board;
}

export function applyMove(
  board: Board,
  index: SquareIndex,
  disc: DiscColor,
): AppliedMove | null {
  const flippedSquares = getFlippedSquares(board, index, disc);

  if (flippedSquares.length === 0) {
    return null;
  }

  const nextBoard = [...board];

  nextBoard[index] = disc;

  for (const flipIndex of flippedSquares) {
    nextBoard[flipIndex] = disc;
  }

  return {
    board: nextBoard,
    flippedSquares,
  };
}

function getDiscsToFlip(
  board: Board,
  startIndex: SquareIndex,
  disc: DiscColor,
  direction: { row: number; column: number },
): SquareIndex[] {
  const opponentDisc = getNextDisc(disc);
  const discsToFlip: SquareIndex[] = [];
  let row = getRow(startIndex) + direction.row;
  let column = getColumn(startIndex) + direction.column;

  while (isInsideBoard(row, column)) {
    const index = getIndex(row, column);
    const cell = board[index];

    if (cell === opponentDisc) {
      discsToFlip.push(index);
      row += direction.row;
      column += direction.column;
      continue;
    }

    if (cell === disc) {
      return discsToFlip;
    }

    return [];
  }

  return [];
}

function getRow(index: number): number {
  return Math.floor(index / BOARD_SIZE);
}

function getColumn(index: number): number {
  return index % BOARD_SIZE;
}

function getIndex(row: number, column: number): number {
  return row * BOARD_SIZE + column;
}

function isInsideBoard(row: number, column: number): boolean {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}
