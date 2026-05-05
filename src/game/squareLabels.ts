import type { SquareIndex } from "./othello";

export const boardColumnLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const boardRowLabels = ["1", "2", "3", "4", "5", "6", "7", "8"];

export function formatSquare(square: SquareIndex): string {
  const column = boardColumnLabels[square % 8];
  const row = boardRowLabels[Math.floor(square / 8)];

  return `${column}${row}`;
}
