import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CpuMoveWorkerResponse } from "./cpuMoveWorkerProtocol";

type WorkerMessageHandler = (
  event: MessageEvent<CpuMoveWorkerResponse>,
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

describe("CPU move worker client", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.resetModules();
    vi.stubGlobal("Worker", FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores a delayed response after the request is cancelled", async () => {
    const { cancelCpuMoveWorkerRequest, chooseCpuMoveInWorker } = await import(
      "./cpuMoveWorkerClient"
    );
    const responsePromise = chooseCpuMoveInWorker({
      board: [],
      disc: "black",
      level: "level6",
      requestId: 1,
      type: "chooseCpuMove",
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

    cancelCpuMoveWorkerRequest(1);
    FakeWorker.instances[0]?.onmessage?.({
      data: {
        move: 19,
        requestId: 1,
        type: "cpuMoveChosen",
      },
    } as MessageEvent<CpuMoveWorkerResponse>);
    await Promise.resolve();

    expect(settled).toBe(false);
  });

  it("rejects and clears all pending requests when the worker errors", async () => {
    const { chooseCpuMoveInWorker } = await import("./cpuMoveWorkerClient");
    const firstResponse = chooseCpuMoveInWorker({
      board: [],
      disc: "black",
      level: "level6",
      requestId: 1,
      type: "chooseCpuMove",
    });
    const secondResponse = chooseCpuMoveInWorker({
      board: [],
      disc: "white",
      level: "level6",
      requestId: 2,
      type: "chooseCpuMove",
    });

    FakeWorker.instances[0]?.onerror?.({
      message: "Worker crashed",
    } as ErrorEvent);

    await expect(firstResponse).rejects.toThrow("Worker crashed");
    await expect(secondResponse).rejects.toThrow("Worker crashed");
  });

  it("recreates the worker for the next request after a worker error", async () => {
    const { chooseCpuMoveInWorker } = await import("./cpuMoveWorkerClient");
    const firstResponse = chooseCpuMoveInWorker({
      board: [],
      disc: "black",
      level: "level6",
      requestId: 1,
      type: "chooseCpuMove",
    });

    FakeWorker.instances[0]?.onerror?.({
      message: "Worker crashed",
    } as ErrorEvent);

    await expect(firstResponse).rejects.toThrow("Worker crashed");
    expect(FakeWorker.instances[0]?.terminated).toBe(true);

    chooseCpuMoveInWorker({
      board: [],
      disc: "white",
      level: "level6",
      requestId: 2,
      type: "chooseCpuMove",
    });

    expect(FakeWorker.instances).toHaveLength(2);
    expect(FakeWorker.instances[1]?.postedMessages).toEqual([
      {
        board: [],
        disc: "white",
        level: "level6",
        requestId: 2,
        type: "chooseCpuMove",
      },
    ]);
  });
});
