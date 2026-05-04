import type {
  ReviewWorkerRequest,
  ReviewWorkerResponse,
} from "./reviewWorkerProtocol";

type PendingRequest = {
  reject: (error: Error) => void;
  resolve: (response: ReviewWorkerResponse) => void;
};

const pendingRequests = new Map<number, PendingRequest>();

let worker: Worker | null = null;

function getWorker(): Worker {
  if (worker !== null) {
    return worker;
  }

  worker = new Worker(new URL("./review.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<ReviewWorkerResponse>) => {
    const response = event.data;
    const pending = pendingRequests.get(response.requestId);

    if (pending === undefined) {
      return;
    }

    pendingRequests.delete(response.requestId);

    if (response.type === "reviewError") {
      pending.reject(new Error(response.message));
      return;
    }

    pending.resolve(response);
  };

  worker.onerror = (event) => {
    for (const pending of pendingRequests.values()) {
      pending.reject(new Error(event.message));
    }

    pendingRequests.clear();

    const failedWorker = worker;
    worker = null;
    failedWorker?.terminate();
  };

  return worker;
}

export function reviewGameInWorker(
  request: ReviewWorkerRequest,
): Promise<ReviewWorkerResponse> {
  return new Promise((resolve, reject) => {
    pendingRequests.set(request.requestId, { reject, resolve });
    getWorker().postMessage(request);
  });
}

export function cancelReviewWorkerRequest(requestId: number): void {
  pendingRequests.delete(requestId);
}
