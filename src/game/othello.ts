export type Disc = "black" | "white";
export type Cell = Disc | null;
export type Board = Cell[];

export function createEmptyBoard(): Board {
  return Array.from({ length: 64 }, () => null);
}

export function getNextDisc(disc: Disc): Disc {
  return disc === "black" ? "white" : "black";
}

export function placeDisc(board: Board, index: number, disc: Disc): Board {
  if (board[index] !== null) {
    return board;
  }

  return board.map((cell, cellIndex) => (cellIndex === index ? disc : cell));
}
