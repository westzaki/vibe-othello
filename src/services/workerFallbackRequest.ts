import { withTimeout } from "./withTimeout";

export type WorkerFallbackRunnerOptions<WorkerRequest, WorkerResponse> = {
  cancelWorkerRequest: (requestId: number) => void;
  postWorkerRequest: (request: WorkerRequest) => Promise<WorkerResponse>;
  timeoutMessage: string;
  timeoutMs: number;
};

export type WorkerFallbackRequestOptions<WorkerRequest, WorkerResponse, AppResponse> = {
  createFallbackResponse: () => AppResponse;
  createWorkerRequest: (workerRequestId: number) => WorkerRequest;
  getWorkerResponse: (response: WorkerResponse) => AppResponse | null;
};

export function createWorkerFallbackRunner<WorkerRequest, WorkerResponse>({
  cancelWorkerRequest,
  postWorkerRequest,
  timeoutMessage,
  timeoutMs,
}: WorkerFallbackRunnerOptions<WorkerRequest, WorkerResponse>) {
  let nextWorkerRequestId = 0;

  return async function runWorkerFallbackRequest<AppResponse>({
    createFallbackResponse,
    createWorkerRequest,
    getWorkerResponse,
  }: WorkerFallbackRequestOptions<
    WorkerRequest,
    WorkerResponse,
    AppResponse
  >): Promise<AppResponse> {
    const workerRequestId = nextWorkerRequestId;
    nextWorkerRequestId += 1;

    try {
      const response = await withTimeout(
        postWorkerRequest(createWorkerRequest(workerRequestId)),
        {
          onTimeout: () => cancelWorkerRequest(workerRequestId),
          timeoutMessage,
          timeoutMs,
        },
      );
      const appResponse = getWorkerResponse(response);

      if (appResponse !== null) {
        return appResponse;
      }
    } catch {
      cancelWorkerRequest(workerRequestId);
    }

    return createFallbackResponse();
  };
}
