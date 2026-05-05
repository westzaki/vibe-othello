import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialBoard } from "../game/othello";
import { createPlayPositionAnalysis } from "../teacher";
import {
  analyzePlayPositionInWorker,
  cancelPlayPositionAnalysisWorkerRequest,
} from "../workers/playPositionAnalysis/playPositionAnalysisWorkerClient";
import { analyzePlayPositionAsync } from "./playPositionAnalysisService";

vi.mock(
  "../workers/playPositionAnalysis/playPositionAnalysisWorkerClient",
  () => ({
    analyzePlayPositionInWorker: vi.fn(),
    cancelPlayPositionAnalysisWorkerRequest: vi.fn(),
  }),
);

const analyzePlayPositionInWorkerMock = vi.mocked(analyzePlayPositionInWorker);
const cancelPlayPositionAnalysisWorkerRequestMock = vi.mocked(
  cancelPlayPositionAnalysisWorkerRequest,
);

describe("play position analysis service", () => {
  beforeEach(() => {
    analyzePlayPositionInWorkerMock.mockReset();
    cancelPlayPositionAnalysisWorkerRequestMock.mockReset();
    vi.useRealTimers();
  });

  it("returns a worker analysis through an async app-facing API", async () => {
    const board = createInitialBoard();
    const analysis = createPlayPositionAnalysis(board, "black");
    analyzePlayPositionInWorkerMock.mockResolvedValue({
      analysis,
      requestId: 100,
      type: "playPositionAnalyzed",
    });

    const response = await analyzePlayPositionAsync({
      board,
      currentDisc: "black",
      requestId: "play-position-opening",
    });

    expect(analyzePlayPositionInWorkerMock).toHaveBeenCalledWith({
      board,
      currentDisc: "black",
      options: undefined,
      requestId: expect.any(Number),
      type: "analyzePlayPosition",
    });
    expect(response).toEqual({
      analysis,
      requestId: "play-position-opening",
    });
    expect(cancelPlayPositionAnalysisWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("falls back to sync analysis when the worker rejects", async () => {
    const board = createInitialBoard();
    analyzePlayPositionInWorkerMock.mockRejectedValue(
      new Error("Worker failed"),
    );

    const response = await analyzePlayPositionAsync({
      board,
      currentDisc: "black",
      requestId: "fallback-play-position",
    });

    expect(response).toEqual({
      analysis: createPlayPositionAnalysis(board, "black"),
      requestId: "fallback-play-position",
    });
    expect(cancelPlayPositionAnalysisWorkerRequestMock).toHaveBeenCalledWith(
      expect.any(Number),
    );
  });

  it("falls back to sync analysis when the worker returns an error response", async () => {
    const board = createInitialBoard();
    analyzePlayPositionInWorkerMock.mockResolvedValue({
      message: "Play position analysis worker error",
      requestId: 101,
      type: "playPositionAnalysisError",
    });

    const response = await analyzePlayPositionAsync({
      board,
      currentDisc: "black",
      requestId: "error-response-play-position",
    });

    expect(response).toEqual({
      analysis: createPlayPositionAnalysis(board, "black"),
      requestId: "error-response-play-position",
    });
    expect(cancelPlayPositionAnalysisWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("falls back to sync analysis when the worker times out", async () => {
    const board = createInitialBoard();
    const setTimeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation((handler) => {
        if (typeof handler === "function") {
          handler();
        }

        return 0 as unknown as ReturnType<typeof setTimeout>;
      });

    analyzePlayPositionInWorkerMock.mockReturnValue(new Promise(() => {}));

    try {
      const response = await analyzePlayPositionAsync({
        board,
        currentDisc: "black",
        requestId: "timeout-play-position",
      });

      expect(response).toEqual({
        analysis: createPlayPositionAnalysis(board, "black"),
        requestId: "timeout-play-position",
      });
      expect(cancelPlayPositionAnalysisWorkerRequestMock).toHaveBeenCalledWith(
        expect.any(Number),
      );
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });
});
