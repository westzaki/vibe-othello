export type Disc = "black" | "white";
export type Cell = Disc | null;
export type Board = Cell[];

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

export function getNextDisc(disc: Disc): Disc {
  return disc === "black" ? "white" : "black";
}

export function placeDisc(board: Board, index: number, disc: Disc): Board {
  if (board[index] !== null) {
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
  disc: Disc,
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
