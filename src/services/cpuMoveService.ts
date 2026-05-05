import { chooseCpuMove, type CpuLevel, usesCpuMoveWorker } from "../cpu";
import type { Board, DiscColor, SquareIndex } from "../game/othello";
import {
  cancelCpuMoveWorkerRequest,
  chooseCpuMoveInWorker,
} from "../workers/cpuMove/cpuMoveWorkerClient";
import type {
  CpuMoveWorkerRequest,
  CpuMoveWorkerResponse,
} from "../workers/cpuMove/cpuMoveWorkerProtocol";
import { createWorkerFallbackRunner } from "./workerFallbackRequest";

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

const runCpuMoveWorkerRequest = createWorkerFallbackRunner<
  CpuMoveWorkerRequest,
  CpuMoveWorkerResponse
>({
  cancelWorkerRequest: cancelCpuMoveWorkerRequest,
  postWorkerRequest: chooseCpuMoveInWorker,
  timeoutMessage: "CPU worker timed out",
  timeoutMs: cpuWorkerTimeoutMs,
});

export async function chooseCpuMoveAsync(
  request: CpuMoveRequest,
): Promise<CpuMoveResponse> {
  if (usesCpuMoveWorker(request.level)) {
    return runCpuMoveWorkerRequest({
      createFallbackResponse: () => chooseCpuMoveSync(request),
      createWorkerRequest: (workerRequestId) => ({
        board: request.board,
        disc: request.disc,
        level: request.level,
        requestId: workerRequestId,
        type: "chooseCpuMove",
      }),
      getWorkerResponse: (response) =>
        response.type === "cpuMoveChosen"
          ? {
              move: response.move,
              requestId: request.requestId,
            }
          : null,
    });
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
