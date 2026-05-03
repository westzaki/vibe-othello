import type { DiscColor, SquareIndex } from "../../game/othello";

export function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}

export function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "黒" : "白";
}
