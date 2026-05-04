import type { CpuLevel } from "../../cpu";
import type { Board, DiscColor, SquareIndex } from "../../game/othello";

export type CpuMoveWorkerRequest = {
  board: Board;
  disc: DiscColor;
  level: CpuLevel;
  requestId: number;
  type: "chooseCpuMove";
};

export type CpuMoveWorkerResponse =
  | {
      move: SquareIndex | null;
      requestId: number;
      type: "cpuMoveChosen";
    }
  | {
      message: string;
      requestId: number;
      type: "cpuMoveError";
    };
