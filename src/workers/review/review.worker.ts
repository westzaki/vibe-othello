import { reviewGame } from "../../teacher";
import type {
  ReviewWorkerRequest,
  ReviewWorkerResponse,
} from "./reviewWorkerProtocol";

const workerScope = self as unknown as Worker;

workerScope.onmessage = (event: MessageEvent<ReviewWorkerRequest>) => {
  const request = event.data;

  if (request.type !== "reviewGame") {
    return;
  }

  try {
    const response: ReviewWorkerResponse = {
      requestId: request.requestId,
      review: reviewGame(request.moveHistory, request.options),
      type: "gameReviewed",
    };

    workerScope.postMessage(response);
  } catch (error) {
    const response: ReviewWorkerResponse = {
      message: error instanceof Error ? error.message : "Unknown review error",
      requestId: request.requestId,
      type: "reviewError",
    };

    workerScope.postMessage(response);
  }
};

export {};
