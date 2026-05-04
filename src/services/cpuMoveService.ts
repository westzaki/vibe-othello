import { chooseCpuMove, type CpuLevel } from "../cpu";
import type { Board, DiscColor, SquareIndex } from "../game/othello";

export type CpuMoveRequest = {
  board: Board;
  disc: DiscColor;
  level: CpuLevel;
  requestId: string;
};

export type CpuMoveResponse = {
  move: SquareIndex | null;
  requestId: string;
};

export async function chooseCpuMoveAsync({
  board,
  disc,
  level,
  requestId,
}: CpuMoveRequest): Promise<CpuMoveResponse> {
  return {
    move: chooseCpuMove(board, disc, level),
    requestId,
  };
}
