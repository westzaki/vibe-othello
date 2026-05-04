import type {
  CpuMoveWorkerRequest,
  CpuMoveWorkerResponse,
} from "./cpuMoveWorkerProtocol";
import { createWorkerRequestClient } from "../createWorkerRequestClient";

const cpuMoveWorkerClient = createWorkerRequestClient<
  CpuMoveWorkerRequest,
  CpuMoveWorkerResponse
>({
  createWorker: () =>
    new Worker(new URL("./cpuMove.worker.ts", import.meta.url), {
      type: "module",
    }),
  getResponseError: (response) =>
    response.type === "cpuMoveError" ? new Error(response.message) : null,
});

export function chooseCpuMoveInWorker(
  request: CpuMoveWorkerRequest,
): Promise<CpuMoveWorkerResponse> {
  return cpuMoveWorkerClient.post(request);
}

export function cancelCpuMoveWorkerRequest(requestId: number): void {
  cpuMoveWorkerClient.cancel(requestId);
}
