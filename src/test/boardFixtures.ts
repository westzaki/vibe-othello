import { SQUARE_COUNT, type Board, type Cell } from "../game/othello";

export function createBoardFixture(
  cells: Partial<Record<number, Cell>>,
  defaultCell: Cell = null,
): Board {
  const board: Board = Array.from({ length: SQUARE_COUNT }, () => defaultCell);

  for (const [square, cell] of Object.entries(cells) as Array<[string, Cell]>) {
    board[Number(square)] = cell;
  }

  return board;
}
