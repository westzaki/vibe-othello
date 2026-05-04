import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialBoard, getLegalMoves } from "../game/othello";
import { chooseCpuMoveInWorker } from "../workers/cpuMove/cpuMoveWorkerClient";
import { chooseCpuMoveAsync } from "./cpuMoveService";

vi.mock("../workers/cpuMove/cpuMoveWorkerClient", () => ({
  chooseCpuMoveInWorker: vi.fn(),
}));

const chooseCpuMoveInWorkerMock = vi.mocked(chooseCpuMoveInWorker);

describe("CPU move service", () => {
  beforeEach(() => {
    chooseCpuMoveInWorkerMock.mockReset();
  });

  it("returns the request id with a selected CPU move", async () => {
    const board = createInitialBoard();
    const response = await chooseCpuMoveAsync({
      board,
      disc: "black",
      level: "level1",
      requestId: "opening-move",
    });

    expect(response.requestId).toBe("opening-move");
    expect(getLegalMoves(board, "black")).toContain(response.move);
    expect(chooseCpuMoveInWorkerMock).not.toHaveBeenCalled();
  });

  it("uses the worker for level 6 and keeps the service request id", async () => {
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

  it("falls back to sync CPU when the level 6 worker rejects", async () => {
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
  });

  it("falls back to sync CPU when the level 6 worker returns an error response", async () => {
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
  });
});
