import type { Board, DiscColor } from "../game/othello";
import {
  type CreatePlayPositionAnalysisOptions,
  type PlayPositionAnalysis,
} from "../teacher";
import {
  analyzePlayPositionInWorker,
  cancelPlayPositionAnalysisWorkerRequest,
} from "../workers/playPositionAnalysis/playPositionAnalysisWorkerClient";
import type {
  PlayPositionAnalysisWorkerRequest,
  PlayPositionAnalysisWorkerResponse,
} from "../workers/playPositionAnalysis/playPositionAnalysisWorkerProtocol";
import { createLightweightPlayPositionAnalysis } from "./playPositionAnalysisFallback";
import { createWorkerFallbackRunner } from "./workerFallbackRequest";

export type PlayPositionAnalysisRequest = {
  board: Board;
  currentDisc: DiscColor;
  options?: CreatePlayPositionAnalysisOptions;
  requestId: string;
};

export type PlayPositionAnalysisResponse = {
  analysis: PlayPositionAnalysis;
  requestId: string;
};

const playPositionAnalysisWorkerTimeoutMs = 2500;

const runPlayPositionAnalysisWorkerRequest = createWorkerFallbackRunner<
  PlayPositionAnalysisWorkerRequest,
  PlayPositionAnalysisWorkerResponse
>({
  cancelWorkerRequest: cancelPlayPositionAnalysisWorkerRequest,
  postWorkerRequest: analyzePlayPositionInWorker,
  timeoutMessage: "Play position analysis worker timed out",
  timeoutMs: playPositionAnalysisWorkerTimeoutMs,
});

export async function analyzePlayPositionAsync(
  request: PlayPositionAnalysisRequest,
): Promise<PlayPositionAnalysisResponse> {
  return runPlayPositionAnalysisWorkerRequest({
    createFallbackResponse: () => analyzePlayPositionSync(request),
    createWorkerRequest: (workerRequestId) => ({
      board: request.board,
      currentDisc: request.currentDisc,
      options: request.options,
      requestId: workerRequestId,
      type: "analyzePlayPosition",
    }),
    getWorkerResponse: (response) =>
      response.type === "playPositionAnalyzed"
        ? {
            analysis: response.analysis,
            requestId: request.requestId,
          }
        : null,
  });
}

function analyzePlayPositionSync(
  request: PlayPositionAnalysisRequest,
): PlayPositionAnalysisResponse {
  return {
    analysis: createLightweightPlayPositionAnalysis(
      request.board,
      request.currentDisc,
      request.options,
    ),
    requestId: request.requestId,
  };
}
