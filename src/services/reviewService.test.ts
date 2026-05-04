import { beforeEach, describe, expect, it, vi } from "vitest";
import { placeCurrentDisc, startNewGame } from "../game/session";
import { reviewGame } from "../teacher";
import {
  cancelReviewWorkerRequest,
  reviewGameInWorker,
} from "../workers/review/reviewWorkerClient";
import { reviewGameAsync } from "./reviewService";

vi.mock("../workers/review/reviewWorkerClient", () => ({
  cancelReviewWorkerRequest: vi.fn(),
  reviewGameInWorker: vi.fn(),
}));

const cancelReviewWorkerRequestMock = vi.mocked(cancelReviewWorkerRequest);
const reviewGameInWorkerMock = vi.mocked(reviewGameInWorker);

describe("review service", () => {
  beforeEach(() => {
    cancelReviewWorkerRequestMock.mockReset();
    reviewGameInWorkerMock.mockReset();
  });

  it("returns a worker review through an async app-facing API", async () => {
    const session = placeCurrentDisc(startNewGame(), 19).session;
    const options = {
      reviewedDisc: "black",
      searchDepth: 1,
    } as const;
    const review = reviewGame(session.moveHistory, options);
    reviewGameInWorkerMock.mockResolvedValue({
      requestId: 100,
      review,
      type: "gameReviewed",
    });

    const response = await reviewGameAsync({
      moveHistory: session.moveHistory,
      options,
      requestId: "review-opening",
    });

    expect(reviewGameInWorkerMock).toHaveBeenCalledWith({
      moveHistory: session.moveHistory,
      options,
      requestId: expect.any(Number),
      type: "reviewGame",
    });
    expect(response).toEqual({
      requestId: "review-opening",
      review,
    });
    expect(cancelReviewWorkerRequestMock).not.toHaveBeenCalled();
  });

  it("falls back to sync review when the worker rejects", async () => {
    const session = placeCurrentDisc(startNewGame(), 19).session;
    const options = {
      reviewedDisc: "black",
      searchDepth: 1,
    } as const;
    reviewGameInWorkerMock.mockRejectedValue(new Error("Worker failed"));

    const response = await reviewGameAsync({
      moveHistory: session.moveHistory,
      options,
      requestId: "fallback-review",
    });

    expect(response).toEqual({
      requestId: "fallback-review",
      review: reviewGame(session.moveHistory, options),
    });
    expect(cancelReviewWorkerRequestMock).toHaveBeenCalledWith(
      expect.any(Number),
    );
  });

  it("falls back to sync review when the worker returns an error response", async () => {
    const session = placeCurrentDisc(startNewGame(), 19).session;
    const options = {
      reviewedDisc: "black",
      searchDepth: 1,
    } as const;
    reviewGameInWorkerMock.mockResolvedValue({
      message: "Review worker error",
      requestId: 101,
      type: "reviewError",
    });

    const response = await reviewGameAsync({
      moveHistory: session.moveHistory,
      options,
      requestId: "error-response-review",
    });

    expect(response).toEqual({
      requestId: "error-response-review",
      review: reviewGame(session.moveHistory, options),
    });
    expect(cancelReviewWorkerRequestMock).not.toHaveBeenCalled();
  });
});
