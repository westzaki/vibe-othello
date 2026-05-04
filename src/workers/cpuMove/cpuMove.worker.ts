import { chooseCpuMove } from "../../cpu";
import type {
  CpuMoveWorkerRequest,
  CpuMoveWorkerResponse,
} from "./cpuMoveWorkerProtocol";

const workerScope = self as unknown as Worker;

workerScope.onmessage = (event: MessageEvent<CpuMoveWorkerRequest>) => {
  const request = event.data;

  if (request.type !== "chooseCpuMove") {
    return;
  }

  try {
    const move = chooseCpuMove(request.board, request.disc, request.level);
    const response: CpuMoveWorkerResponse = {
      move,
      requestId: request.requestId,
      type: "cpuMoveChosen",
    };

    workerScope.postMessage(response);
  } catch (error) {
    const response: CpuMoveWorkerResponse = {
      message: error instanceof Error ? error.message : "Unknown CPU error",
      requestId: request.requestId,
      type: "cpuMoveError",
    };

    workerScope.postMessage(response);
  }
};

export {};
