import type { Board, DiscColor, SquareIndex } from "../../game/othello";

export type CpuMoveStrategy = (
  board: Board,
  disc: DiscColor,
) => SquareIndex | null;
