import { createPlayPositionAnalysis } from "../../teacher";
import { getWorkerScope } from "../workerScope";
import type {
  PlayPositionAnalysisWorkerRequest,
  PlayPositionAnalysisWorkerResponse,
} from "./playPositionAnalysisWorkerProtocol";

const workerScope = getWorkerScope();

workerScope.onmessage = (
  event: MessageEvent<PlayPositionAnalysisWorkerRequest>,
) => {
  const request = event.data;

  if (request.type !== "analyzePlayPosition") {
    return;
  }

  try {
    const response: PlayPositionAnalysisWorkerResponse = {
      analysis: createPlayPositionAnalysis(
        request.board,
        request.currentDisc,
        request.options,
      ),
      requestId: request.requestId,
      type: "playPositionAnalyzed",
    };

    workerScope.postMessage(response);
  } catch (error) {
    const response: PlayPositionAnalysisWorkerResponse = {
      message:
        error instanceof Error
          ? error.message
          : "Unknown play position analysis error",
      requestId: request.requestId,
      type: "playPositionAnalysisError",
    };

    workerScope.postMessage(response);
  }
};

export {};
