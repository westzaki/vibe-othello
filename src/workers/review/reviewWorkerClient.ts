import type {
  ReviewWorkerRequest,
  ReviewWorkerResponse,
} from "./reviewWorkerProtocol";
import { createWorkerRequestClient } from "../createWorkerRequestClient";

const reviewWorkerClient = createWorkerRequestClient<
  ReviewWorkerRequest,
  ReviewWorkerResponse
>({
  createWorker: () =>
    new Worker(new URL("./review.worker.ts", import.meta.url), {
      type: "module",
    }),
  getResponseError: (response) =>
    response.type === "reviewError" ? new Error(response.message) : null,
});

export function reviewGameInWorker(
  request: ReviewWorkerRequest,
): Promise<ReviewWorkerResponse> {
  return reviewWorkerClient.post(request);
}

export function cancelReviewWorkerRequest(requestId: number): void {
  reviewWorkerClient.cancel(requestId);
}
