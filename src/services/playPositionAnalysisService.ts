import type { Board, DiscColor } from "../game/othello";
import {
  type CreatePlayPositionAnalysisOptions,
  type PlayPositionAnalysis,
} from "../teacher";
import {
  analyzePlayPositionInWorker,
  cancelPlayPositionAnalysisWorkerRequest,
} from "../workers/playPositionAnalysis/playPositionAnalysisWorkerClient";
import { createLightweightPlayPositionAnalysis } from "./playPositionAnalysisFallback";
import { withTimeout } from "./withTimeout";

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

let nextWorkerRequestId = 0;

export async function analyzePlayPositionAsync(
  request: PlayPositionAnalysisRequest,
): Promise<PlayPositionAnalysisResponse> {
  if (request.options?.skipMoveAnalysis === true) {
    return analyzePlayPositionSync(request);
  }

  const workerRequestId = nextWorkerRequestId;
  nextWorkerRequestId += 1;

  try {
    const response = await withTimeout(
      analyzePlayPositionInWorker({
        board: request.board,
        currentDisc: request.currentDisc,
        options: request.options,
        requestId: workerRequestId,
        type: "analyzePlayPosition",
      }),
      {
        onTimeout: () =>
          cancelPlayPositionAnalysisWorkerRequest(workerRequestId),
        timeoutMessage: "Play position analysis worker timed out",
        timeoutMs: playPositionAnalysisWorkerTimeoutMs,
      },
    );

    if (response.type === "playPositionAnalyzed") {
      return {
        analysis: response.analysis,
        requestId: request.requestId,
      };
    }
  } catch {
    cancelPlayPositionAnalysisWorkerRequest(workerRequestId);
    // Fall back to sync analysis below.
  }

  return analyzePlayPositionSync(request);
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
