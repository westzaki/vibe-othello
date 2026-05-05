import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialBoard, getLegalMoves } from "../game/othello";
import {
  cancelCpuMoveWorkerRequest,
  chooseCpuMoveInWorker,
} from "../workers/cpuMove/cpuMoveWorkerClient";
import { chooseCpuMoveAsync } from "./cpuMoveService";

vi.mock("../workers/cpuMove/cpuMoveWorkerClient", () => ({
  cancelCpuMoveWorkerRequest: vi.fn(),
  chooseCpuMoveInWorker: vi.fn(),
}));

const cancelCpuMoveWorkerRequestMock = vi.mocked(cancelCpuMoveWorkerRequest);
const chooseCpuMoveInWorkerMock = vi.mocked(chooseCpuMoveInWorker);

describe("CPU move service", () => {
  beforeEach(() => {
    cancelCpuMoveWorkerRequestMock.mockReset();
    chooseCpuMoveInWorkerMock.mockReset();
    vi.useRealTimers();
  });

  it("uses sync CPU for level 1 and returns a move", async () => {
    const board = createInitialBoard();
    const response = await chooseCpuMoveAsync({
      board,
      disc: "black",
      level: "level1",
      requestId: "opening-move",
    });

    expect(response.requestId).toBe("opening-move");
    expect(getLegalMoves(board, "black")).toContain(response.move);
    expect(cancelCpuMoveWorkerRequestMock).not.toHaveBeenCalled();
    expect(chooseCpuMoveInWorkerMock).not.toHaveBeenCalled();
  });

  it("uses the configured worker CPU level and keeps the service request id", async () => {
    const board = createInitialBoard();
    chooseCpuMoveInWorkerMock.mockResolvedValue({
      move: 19,
      requestId: 100,
      type: "cpuMoveChosen",
    });

    const response = await chooseCpuMoveAsync({
      board,
      disc: "black",
      level: "level6",
      requestId: "grandmaster-move",
    });

    expect(chooseCpuMoveInWorkerMock).toHaveBeenCalledWith({
      board,
      disc: "black",
      level: "level6",
      requestId: expect.any(Number),
      type: "chooseCpuMove",
    });
    expect(response).toEqual({
      move: 19,
      requestId: "grandmaster-move",
    });
  });

  it("falls back to sync CPU when the worker CPU level rejects", async () => {
    const board = createInitialBoard();
    chooseCpuMoveInWorkerMock.mockRejectedValue(new Error("Worker failed"));

    const response = await chooseCpuMoveAsync({
      board,
      disc: "black",
      level: "level6",
      requestId: "fallback-move",
    });

    expect(response.requestId).toBe("fallback-move");
    expect(getLegalMoves(board, "black")).toContain(response.move);
    expect(cancelCpuMoveWorkerRequestMock).toHaveBeenCalledWith(
      expect.any(Number),
    );
  });

  it("falls back to sync CPU when the worker CPU level returns an error response", async () => {
    const board = createInitialBoard();
    chooseCpuMoveInWorkerMock.mockResolvedValue({
      message: "Worker CPU error",
      requestId: 101,
      type: "cpuMoveError",
    });

    const response = await chooseCpuMoveAsync({
      board,
      disc: "black",
      level: "level6",
      requestId: "error-response-fallback",
    });

    expect(response.requestId).toBe("error-response-fallback");
    expect(getLegalMoves(board, "black")).toContain(response.move);
    expect(cancelCpuMoveWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("falls back to sync CPU when the worker CPU level times out", async () => {
    const board = createInitialBoard();
    const setTimeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation((handler) => {
        if (typeof handler === "function") {
          handler();
        }

        return 0 as unknown as ReturnType<typeof setTimeout>;
      });

    chooseCpuMoveInWorkerMock.mockReturnValue(new Promise(() => {}));

    try {
      const response = await chooseCpuMoveAsync({
        board,
        disc: "black",
        level: "level6",
        requestId: "timeout-fallback",
      });

      expect(response.requestId).toBe("timeout-fallback");
      expect(getLegalMoves(board, "black")).toContain(response.move);
      expect(cancelCpuMoveWorkerRequestMock).toHaveBeenCalledWith(
        expect.any(Number),
      );
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });
});
