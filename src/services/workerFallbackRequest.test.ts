import { describe, expect, it, vi } from "vitest";
import { createWorkerFallbackRunner } from "./workerFallbackRequest";

type TestWorkerRequest = {
  requestId: number;
  type: "test";
};

type TestWorkerResponse =
  | {
      requestId: number;
      type: "done";
      value: number;
    }
  | {
      requestId: number;
      type: "error";
    };

describe("worker fallback request runner", () => {
  it("returns a mapped worker response", async () => {
    const cancelWorkerRequest = vi.fn();
    const postWorkerRequest = vi
      .fn<(request: TestWorkerRequest) => Promise<TestWorkerResponse>>()
      .mockResolvedValue({
        requestId: 0,
        type: "done",
        value: 12,
      });
    const runWorkerFallbackRequest = createWorkerFallbackRunner({
      cancelWorkerRequest,
      postWorkerRequest,
      timeoutMessage: "Worker timed out",
      timeoutMs: 1000,
    });

    await expect(
      runWorkerFallbackRequest({
        createFallbackResponse: () => -1,
        createWorkerRequest: (requestId) => ({
          requestId,
          type: "test",
        }),
        getWorkerResponse: (response) =>
          response.type === "done" ? response.value : null,
      }),
    ).resolves.toBe(12);
    expect(postWorkerRequest).toHaveBeenCalledWith({
      requestId: 0,
      type: "test",
    });
    expect(cancelWorkerRequest).not.toHaveBeenCalled();
  });

  it("falls back and cancels when the worker rejects", async () => {
    const cancelWorkerRequest = vi.fn();
    const postWorkerRequest = vi
      .fn<(request: TestWorkerRequest) => Promise<TestWorkerResponse>>()
      .mockRejectedValue(new Error("Worker failed"));
    const runWorkerFallbackRequest = createWorkerFallbackRunner({
      cancelWorkerRequest,
      postWorkerRequest,
      timeoutMessage: "Worker timed out",
      timeoutMs: 1000,
    });

    await expect(
      runWorkerFallbackRequest({
        createFallbackResponse: () => -1,
        createWorkerRequest: (requestId) => ({
          requestId,
          type: "test",
        }),
        getWorkerResponse: (response) =>
          response.type === "done" ? response.value : null,
      }),
    ).resolves.toBe(-1);
    expect(cancelWorkerRequest).toHaveBeenCalledWith(0);
  });

  it("falls back without cancelling when the worker returns an unhandled response", async () => {
    const cancelWorkerRequest = vi.fn();
    const postWorkerRequest = vi
      .fn<(request: TestWorkerRequest) => Promise<TestWorkerResponse>>()
      .mockResolvedValue({
        requestId: 0,
        type: "error",
      });
    const runWorkerFallbackRequest = createWorkerFallbackRunner({
      cancelWorkerRequest,
      postWorkerRequest,
      timeoutMessage: "Worker timed out",
      timeoutMs: 1000,
    });

    await expect(
      runWorkerFallbackRequest({
        createFallbackResponse: () => -1,
        createWorkerRequest: (requestId) => ({
          requestId,
          type: "test",
        }),
        getWorkerResponse: (response) =>
          response.type === "done" ? response.value : null,
      }),
    ).resolves.toBe(-1);
    expect(cancelWorkerRequest).not.toHaveBeenCalled();
  });
});
