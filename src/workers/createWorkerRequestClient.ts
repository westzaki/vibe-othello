type WorkerRequest = {
  requestId: number;
};

type WorkerResponse = {
  requestId: number;
};

type PendingRequest<Response> = {
  reject: (error: Error) => void;
  resolve: (response: Response) => void;
};

export type WorkerRequestClient<Request extends WorkerRequest, Response extends WorkerResponse> = {
  cancel: (requestId: number) => void;
  post: (request: Request) => Promise<Response>;
};

export type WorkerRequestClientOptions<Response extends WorkerResponse> = {
  createWorker: () => Worker;
  getResponseError: (response: Response) => Error | null;
};

export function createWorkerRequestClient<
  Request extends WorkerRequest,
  Response extends WorkerResponse,
>({
  createWorker,
  getResponseError,
}: WorkerRequestClientOptions<Response>): WorkerRequestClient<
  Request,
  Response
> {
  const pendingRequests = new Map<number, PendingRequest<Response>>();
  let worker: Worker | null = null;

  function getWorker(): Worker {
    if (worker !== null) {
      return worker;
    }

    worker = createWorker();

    worker.onmessage = (event: MessageEvent<Response>) => {
      const response = event.data;
      const pending = pendingRequests.get(response.requestId);

      if (pending === undefined) {
        return;
      }

      pendingRequests.delete(response.requestId);

      const responseError = getResponseError(response);

      if (responseError !== null) {
        pending.reject(responseError);
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

  return {
    cancel(requestId) {
      pendingRequests.delete(requestId);
    },
    post(request) {
      return new Promise((resolve, reject) => {
        pendingRequests.set(request.requestId, { reject, resolve });

        try {
          getWorker().postMessage(request);
        } catch (error) {
          pendingRequests.delete(request.requestId);
          reject(
            error instanceof Error
              ? error
              : new Error("Worker request failed"),
          );
        }
      });
    },
  };
}
