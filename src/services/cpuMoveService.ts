import { chooseCpuMove, type CpuLevel } from "../cpu";
import type { Board, DiscColor, SquareIndex } from "../game/othello";
import {
  cancelCpuMoveWorkerRequest,
  chooseCpuMoveInWorker,
} from "../workers/cpuMove/cpuMoveWorkerClient";
import { withTimeout } from "./withTimeout";

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

const cpuWorkerTimeoutMs = 1000;

let nextWorkerRequestId = 0;

export async function chooseCpuMoveAsync(
  request: CpuMoveRequest,
): Promise<CpuMoveResponse> {
  if (request.level === "level6") {
    const workerRequestId = nextWorkerRequestId;
    nextWorkerRequestId += 1;

    try {
      const response = await withTimeout(
        chooseCpuMoveInWorker({
          board: request.board,
          disc: request.disc,
          level: request.level,
          requestId: workerRequestId,
          type: "chooseCpuMove",
        }),
        {
          onTimeout: () => cancelCpuMoveWorkerRequest(workerRequestId),
          timeoutMessage: "CPU worker timed out",
          timeoutMs: cpuWorkerTimeoutMs,
        },
      );

      if (response.type === "cpuMoveChosen") {
        return {
          move: response.move,
          requestId: request.requestId,
        };
      }
    } catch {
      cancelCpuMoveWorkerRequest(workerRequestId);
      // Fall back to sync CPU below.
    }
  }

  return chooseCpuMoveSync(request);
}

function chooseCpuMoveSync({
  board,
  disc,
  level,
  requestId,
}: CpuMoveRequest): CpuMoveResponse {
  return {
    move: chooseCpuMove(board, disc, level),
    requestId,
  };
}
