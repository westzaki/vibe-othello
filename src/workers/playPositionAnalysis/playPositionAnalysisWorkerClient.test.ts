import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialBoard } from "../../game/othello";
import { createPlayPositionAnalysis } from "../../teacher";
import type { PlayPositionAnalysisWorkerResponse } from "./playPositionAnalysisWorkerProtocol";

type WorkerMessageHandler = (
  event: MessageEvent<PlayPositionAnalysisWorkerResponse>,
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

describe("play position analysis worker client", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.resetModules();
    vi.stubGlobal("Worker", FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the matching analysis response", async () => {
    const board = createInitialBoard();
    const analysis = createPlayPositionAnalysis(board, "black");
    const { analyzePlayPositionInWorker } =
      await import("./playPositionAnalysisWorkerClient");
    const responsePromise = analyzePlayPositionInWorker({
      board,
      currentDisc: "black",
      requestId: 1,
      type: "analyzePlayPosition",
    });

    FakeWorker.instances[0]?.onmessage?.({
      data: {
        analysis,
        requestId: 1,
        type: "playPositionAnalyzed",
      },
    } as MessageEvent<PlayPositionAnalysisWorkerResponse>);

    await expect(responsePromise).resolves.toEqual({
      analysis,
      requestId: 1,
      type: "playPositionAnalyzed",
    });
  });

  it("ignores a delayed response after the request is cancelled", async () => {
    const board = createInitialBoard();
    const analysis = createPlayPositionAnalysis(board, "black");
    const {
      analyzePlayPositionInWorker,
      cancelPlayPositionAnalysisWorkerRequest,
    } = await import("./playPositionAnalysisWorkerClient");
    const responsePromise = analyzePlayPositionInWorker({
      board,
      currentDisc: "black",
      requestId: 1,
      type: "analyzePlayPosition",
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

    cancelPlayPositionAnalysisWorkerRequest(1);
    FakeWorker.instances[0]?.onmessage?.({
      data: {
        analysis,
        requestId: 1,
        type: "playPositionAnalyzed",
      },
    } as MessageEvent<PlayPositionAnalysisWorkerResponse>);
    await Promise.resolve();

    expect(settled).toBe(false);
  });

  it("rejects and clears all pending requests when the worker errors", async () => {
    const board = createInitialBoard();
    const { analyzePlayPositionInWorker } =
      await import("./playPositionAnalysisWorkerClient");
    const firstResponse = analyzePlayPositionInWorker({
      board,
      currentDisc: "black",
      requestId: 1,
      type: "analyzePlayPosition",
    });
    const secondResponse = analyzePlayPositionInWorker({
      board,
      currentDisc: "white",
      requestId: 2,
      type: "analyzePlayPosition",
    });

    FakeWorker.instances[0]?.onerror?.({
      message: "Worker crashed",
    } as ErrorEvent);

    await expect(firstResponse).rejects.toThrow("Worker crashed");
    await expect(secondResponse).rejects.toThrow("Worker crashed");
  });

  it("recreates the worker for the next request after a worker error", async () => {
    const board = createInitialBoard();
    const { analyzePlayPositionInWorker } =
      await import("./playPositionAnalysisWorkerClient");
    const firstResponse = analyzePlayPositionInWorker({
      board,
      currentDisc: "black",
      requestId: 1,
      type: "analyzePlayPosition",
    });

    FakeWorker.instances[0]?.onerror?.({
      message: "Worker crashed",
    } as ErrorEvent);

    await expect(firstResponse).rejects.toThrow("Worker crashed");
    expect(FakeWorker.instances[0]?.terminated).toBe(true);

    analyzePlayPositionInWorker({
      board,
      currentDisc: "white",
      requestId: 2,
      type: "analyzePlayPosition",
    });

    expect(FakeWorker.instances).toHaveLength(2);
    expect(FakeWorker.instances[1]?.postedMessages).toEqual([
      {
        board,
        currentDisc: "white",
        requestId: 2,
        type: "analyzePlayPosition",
      },
    ]);
  });
});
