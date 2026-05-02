export type DiscColor = "black" | "white";
export type Cell = DiscColor | null;
export type Board = Cell[];
export type DiscCounts = Record<DiscColor, number>;
export type Winner = DiscColor | "draw";

const boardSize = 8;
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
  return Array.from({ length: boardSize * boardSize }, () => null);
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
  index: number,
  disc: DiscColor,
): boolean {
  if (board[index] !== null) {
    return false;
  }

  return directions.some(
    (direction) => getDiscsToFlip(board, index, disc, direction).length > 0,
  );
}

export function getLegalMoves(board: Board, disc: DiscColor): number[] {
  return board.flatMap((_, index) =>
    isLegalMove(board, index, disc) ? [index] : [],
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
  if (!isLegalMove(board, index, disc)) {
    return board;
  }

  const nextBoard = [...board];

  nextBoard[index] = disc;

  for (const direction of directions) {
    const discsToFlip = getDiscsToFlip(board, index, disc, direction);

    for (const flipIndex of discsToFlip) {
      nextBoard[flipIndex] = disc;
    }
  }

  return nextBoard;
}

function getDiscsToFlip(
  board: Board,
  startIndex: number,
  disc: DiscColor,
  direction: { row: number; column: number },
): number[] {
  const opponentDisc = getNextDisc(disc);
  const discsToFlip: number[] = [];
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
  return Math.floor(index / boardSize);
}

function getColumn(index: number): number {
  return index % boardSize;
}

function getIndex(row: number, column: number): number {
  return row * boardSize + column;
}

function isInsideBoard(row: number, column: number): boolean {
  return row >= 0 && row < boardSize && column >= 0 && column < boardSize;
}
