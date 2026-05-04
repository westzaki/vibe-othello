import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewWorkerResponse } from "./reviewWorkerProtocol";

type WorkerMessageHandler = (
  event: MessageEvent<ReviewWorkerResponse>,
) => void;
type WorkerErrorHandler = (event: ErrorEvent) => void;

class FakeWorker {
  static instances: FakeWorker[] = [];

  onerror: WorkerErrorHandler | null = null;
  onmessage: WorkerMessageHandler | null = null;
  postedMessages: unknown[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: unknown): void {
    this.postedMessages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }
}

describe("review worker client", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.resetModules();
    vi.stubGlobal("Worker", FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the matching review response", async () => {
    const { reviewGameInWorker } = await import("./reviewWorkerClient");
    const responsePromise = reviewGameInWorker({
      moveHistory: [],
      options: { reviewedDisc: "black" },
      requestId: 1,
      type: "reviewGame",
    });

    FakeWorker.instances[0]?.onmessage?.({
      data: {
        requestId: 1,
        review: {
          highlights: { badMoves: [], goodMoves: [] },
          moveCount: 0,
          reviewedDisc: "black",
          reviewedMoves: [],
        },
        type: "gameReviewed",
      },
    } as MessageEvent<ReviewWorkerResponse>);

    await expect(responsePromise).resolves.toEqual({
      requestId: 1,
      review: {
        highlights: { badMoves: [], goodMoves: [] },
        moveCount: 0,
        reviewedDisc: "black",
        reviewedMoves: [],
      },
      type: "gameReviewed",
    });
  });

  it("ignores a delayed response after the request is cancelled", async () => {
    const { cancelReviewWorkerRequest, reviewGameInWorker } = await import(
      "./reviewWorkerClient"
    );
    const responsePromise = reviewGameInWorker({
      moveHistory: [],
      options: { reviewedDisc: "black" },
      requestId: 1,
      type: "reviewGame",
    });
    let settled = false;

    responsePromise.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    cancelReviewWorkerRequest(1);
    FakeWorker.instances[0]?.onmessage?.({
      data: {
        requestId: 1,
        review: {
          highlights: { badMoves: [], goodMoves: [] },
          moveCount: 0,
          reviewedDisc: "black",
          reviewedMoves: [],
        },
        type: "gameReviewed",
      },
    } as MessageEvent<ReviewWorkerResponse>);
    await Promise.resolve();

    expect(settled).toBe(false);
  });

  it("rejects and clears all pending requests when the worker errors", async () => {
    const { reviewGameInWorker } = await import("./reviewWorkerClient");
    const firstResponse = reviewGameInWorker({
      moveHistory: [],
      options: { reviewedDisc: "black" },
      requestId: 1,
      type: "reviewGame",
    });
    const secondResponse = reviewGameInWorker({
      moveHistory: [],
      options: { reviewedDisc: "white" },
      requestId: 2,
      type: "reviewGame",
    });

    FakeWorker.instances[0]?.onerror?.({
      message: "Worker crashed",
    } as ErrorEvent);

    await expect(firstResponse).rejects.toThrow("Worker crashed");
    await expect(secondResponse).rejects.toThrow("Worker crashed");
  });

  it("recreates the worker for the next request after a worker error", async () => {
    const { reviewGameInWorker } = await import("./reviewWorkerClient");
    const firstResponse = reviewGameInWorker({
      moveHistory: [],
      options: { reviewedDisc: "black" },
      requestId: 1,
      type: "reviewGame",
    });

    FakeWorker.instances[0]?.onerror?.({
      message: "Worker crashed",
    } as ErrorEvent);

    await expect(firstResponse).rejects.toThrow("Worker crashed");
    expect(FakeWorker.instances[0]?.terminated).toBe(true);

    reviewGameInWorker({
      moveHistory: [],
      options: { reviewedDisc: "white" },
      requestId: 2,
      type: "reviewGame",
    });

    expect(FakeWorker.instances).toHaveLength(2);
    expect(FakeWorker.instances[1]?.postedMessages).toEqual([
      {
        moveHistory: [],
        options: { reviewedDisc: "white" },
        requestId: 2,
        type: "reviewGame",
      },
    ]);
  });
});
