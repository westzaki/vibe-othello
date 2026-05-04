import type { MoveRecord } from "../game/session";
import { reviewGame } from "../teacher";
import type { GameReview, ReviewGameOptions } from "../teacher";
import {
  cancelReviewWorkerRequest,
  reviewGameInWorker,
} from "../workers/review/reviewWorkerClient";

export type ReviewGameRequest = {
  moveHistory: MoveRecord[];
  options: ReviewGameOptions;
  requestId: string;
};

export type ReviewGameResponse = {
  requestId: string;
  review: GameReview;
};

let nextWorkerRequestId = 0;

export async function reviewGameAsync(
  request: ReviewGameRequest,
): Promise<ReviewGameResponse> {
  const workerRequestId = nextWorkerRequestId;
  nextWorkerRequestId += 1;

  try {
    const response = await reviewGameInWorker({
      moveHistory: request.moveHistory,
      options: request.options,
      requestId: workerRequestId,
      type: "reviewGame",
    });

    if (response.type === "gameReviewed") {
      return {
        requestId: request.requestId,
        review: response.review,
      };
    }
  } catch {
    cancelReviewWorkerRequest(workerRequestId);
    // Fall back to sync review below.
  }

  return reviewGameSync(request);
}

function reviewGameSync(request: ReviewGameRequest): ReviewGameResponse {
  return {
    requestId: request.requestId,
    review: reviewGame(request.moveHistory, request.options),
  };
}
