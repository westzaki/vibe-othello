import type {
  CpuMoveWorkerRequest,
  CpuMoveWorkerResponse,
} from "./cpuMoveWorkerProtocol";

type PendingRequest = {
  reject: (error: Error) => void;
  resolve: (response: CpuMoveWorkerResponse) => void;
};

const pendingRequests = new Map<number, PendingRequest>();

let worker: Worker | null = null;

function getWorker(): Worker {
  if (worker !== null) {
    return worker;
  }

  worker = new Worker(new URL("./cpuMove.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<CpuMoveWorkerResponse>) => {
    const response = event.data;
    const pending = pendingRequests.get(response.requestId);

    if (pending === undefined) {
      return;
    }

    pendingRequests.delete(response.requestId);

    if (response.type === "cpuMoveError") {
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
  };

  return worker;
}

export function chooseCpuMoveInWorker(
  request: CpuMoveWorkerRequest,
): Promise<CpuMoveWorkerResponse> {
  return new Promise((resolve, reject) => {
    pendingRequests.set(request.requestId, { reject, resolve });
    getWorker().postMessage(request);
  });
}
