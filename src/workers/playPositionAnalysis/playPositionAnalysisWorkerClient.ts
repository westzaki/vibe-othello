import { createWorkerRequestClient } from "../createWorkerRequestClient";
import type {
  PlayPositionAnalysisWorkerRequest,
  PlayPositionAnalysisWorkerResponse,
} from "./playPositionAnalysisWorkerProtocol";

const playPositionAnalysisWorkerClient = createWorkerRequestClient<
  PlayPositionAnalysisWorkerRequest,
  PlayPositionAnalysisWorkerResponse
>({
  createWorker: () =>
    new Worker(new URL("./playPositionAnalysis.worker.ts", import.meta.url), {
      type: "module",
    }),
  getResponseError: (response) =>
    response.type === "playPositionAnalysisError"
      ? new Error(response.message)
      : null,
});

export function analyzePlayPositionInWorker(
  request: PlayPositionAnalysisWorkerRequest,
): Promise<PlayPositionAnalysisWorkerResponse> {
  return playPositionAnalysisWorkerClient.post(request);
}

export function cancelPlayPositionAnalysisWorkerRequest(
  requestId: number,
): void {
  playPositionAnalysisWorkerClient.cancel(requestId);
}
