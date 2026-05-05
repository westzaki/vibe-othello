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
      source: "worker",
    });
    expect(cancelPlayPositionAnalysisWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("falls back to sync analysis when the worker rejects", async () => {
    const board = createInitialBoard();
    const options = {
      includeBestMoveHint: true,
      searchDepth: 1,
      useTeacherGuidanceMove: true,
    } as const;
    analyzePlayPositionInWorkerMock.mockRejectedValue(
      new Error("Worker failed"),
    );

    const response = await analyzePlayPositionAsync({
      board,
      currentDisc: "black",
      options,
      requestId: "fallback-play-position",
    });

    const expectedAnalysis = createPlayPositionAnalysis(board, "black", {
      ...options,
      includeBestMoveHint: false,
      skipMoveAnalysis: true,
      useTeacherGuidanceMove: false,
    });

    expect(response).toEqual({
      analysis: expectedAnalysis,
      requestId: "fallback-play-position",
      source: "fallback",
    });
    expect(response.analysis.coachHints).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "bestMove",
        }),
      ]),
    );
    expect(cancelPlayPositionAnalysisWorkerRequestMock).toHaveBeenCalledWith(
      expect.any(Number),
    );
  });

  it("falls back to sync analysis when the worker returns an error response", async () => {
    const board = createInitialBoard();
    const options = {
      includeBestMoveHint: true,
      searchDepth: 1,
      useTeacherGuidanceMove: true,
    } as const;
    analyzePlayPositionInWorkerMock.mockResolvedValue({
      message: "Play position analysis worker error",
      requestId: 101,
      type: "playPositionAnalysisError",
    });

    const response = await analyzePlayPositionAsync({
      board,
      currentDisc: "black",
      options,
      requestId: "error-response-play-position",
    });

    const expectedAnalysis = createPlayPositionAnalysis(board, "black", {
      ...options,
      includeBestMoveHint: false,
      skipMoveAnalysis: true,
      useTeacherGuidanceMove: false,
    });

    expect(response).toEqual({
      analysis: expectedAnalysis,
      requestId: "error-response-play-position",
      source: "fallback",
    });
    expect(response.analysis.coachHints).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "bestMove",
        }),
      ]),
    );
    expect(cancelPlayPositionAnalysisWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("falls back to sync analysis when the worker times out", async () => {
    const board = createInitialBoard();
    const options = {
      includeBestMoveHint: true,
      searchDepth: 1,
      useTeacherGuidanceMove: true,
    } as const;
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
        options,
        requestId: "timeout-play-position",
      });

      const expectedAnalysis = createPlayPositionAnalysis(board, "black", {
        ...options,
        includeBestMoveHint: false,
        skipMoveAnalysis: true,
        useTeacherGuidanceMove: false,
      });

      expect(response).toEqual({
        analysis: expectedAnalysis,
        requestId: "timeout-play-position",
        source: "fallback",
      });
      expect(response.analysis.coachHints).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "bestMove",
          }),
        ]),
      );
      expect(cancelPlayPositionAnalysisWorkerRequestMock).toHaveBeenCalledWith(
        expect.any(Number),
      );
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });

  it("keeps skipMoveAnalysis requests on the sync lightweight path", async () => {
    const board = createInitialBoard();

    const response = await analyzePlayPositionAsync({
      board,
      currentDisc: "black",
      options: {
        skipMoveAnalysis: true,
      },
      requestId: "lightweight-play-position",
    });

    expect(analyzePlayPositionInWorkerMock).not.toHaveBeenCalled();
    expect(response).toEqual({
      analysis: createPlayPositionAnalysis(board, "black", {
        skipMoveAnalysis: true,
      }),
      requestId: "lightweight-play-position",
      source: "sync",
    });
  });
});
