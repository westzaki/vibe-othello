import type { MoveRecord } from "../game/session";
import { reviewGame } from "../teacher";
import type { GameReview, ReviewGameOptions } from "../teacher";
import {
  cancelReviewWorkerRequest,
  reviewGameInWorker,
} from "../workers/review/reviewWorkerClient";
import type {
  ReviewWorkerRequest,
  ReviewWorkerResponse,
} from "../workers/review/reviewWorkerProtocol";
import { createLightweightReviewGameOptions } from "./reviewFallback";
import { createWorkerFallbackRunner } from "./workerFallbackRequest";

export type ReviewGameRequest = {
  moveHistory: MoveRecord[];
  options: ReviewGameOptions;
  requestId: string;
};

export type ReviewGameResponse = {
  requestId: string;
  review: GameReview;
};

const reviewWorkerTimeoutMs = 3000;

const runReviewWorkerRequest = createWorkerFallbackRunner<
  ReviewWorkerRequest,
  ReviewWorkerResponse
>({
  cancelWorkerRequest: cancelReviewWorkerRequest,
  postWorkerRequest: reviewGameInWorker,
  timeoutMessage: "Review worker timed out",
  timeoutMs: reviewWorkerTimeoutMs,
});

export async function reviewGameAsync(
  request: ReviewGameRequest,
): Promise<ReviewGameResponse> {
  return runReviewWorkerRequest({
    createFallbackResponse: () => reviewGameSync(request),
    createWorkerRequest: (workerRequestId) => ({
      moveHistory: request.moveHistory,
      options: request.options,
      requestId: workerRequestId,
      type: "reviewGame",
    }),
    getWorkerResponse: (response) =>
      response.type === "gameReviewed"
        ? {
            requestId: request.requestId,
            review: response.review,
          }
        : null,
  });
}

function reviewGameSync(request: ReviewGameRequest): ReviewGameResponse {
  return {
    requestId: request.requestId,
    review: reviewGame(
      request.moveHistory,
      createLightweightReviewGameOptions(request.options),
    ),
  };
}
