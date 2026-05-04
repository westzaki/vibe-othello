import { describe, expect, it } from "vitest";
import { createMatchPlayerSettings } from "../game/matchSetup";
import type { GameReview } from "../teacher";
import {
  createErrorGameReviewRequestState,
  createIdleGameReviewRequestState,
  createReadyGameReviewRequestState,
  getCurrentGameReviewAsyncState,
  type GameReviewRequestSources,
} from "./gameReviewAsyncState";

describe("game review async state", () => {
  it("returns unavailable before review state matters", () => {
    const sources = createSources();
    const review = createReview();
    const requestState = createReadyGameReviewRequestState(
      "review-1",
      sources,
      review,
    );

    expect(
      getCurrentGameReviewAsyncState(requestState, sources, false),
    ).toEqual({ status: "unavailable" });
  });

  it("returns loading for idle or stale request state", () => {
    const sources = createSources();
    const staleSources = createSources();
    const review = createReview();

    expect(
      getCurrentGameReviewAsyncState(
        createIdleGameReviewRequestState(),
        sources,
        true,
      ),
    ).toEqual({ status: "loading" });
    expect(
      getCurrentGameReviewAsyncState(
        createReadyGameReviewRequestState("review-1", staleSources, review),
        sources,
        true,
      ),
    ).toEqual({ status: "loading" });
  });

  it("returns the current ready review", () => {
    const sources = createSources();
    const review = createReview();

    expect(
      getCurrentGameReviewAsyncState(
        createReadyGameReviewRequestState("review-1", sources, review),
        sources,
        true,
      ),
    ).toEqual({
      review,
      status: "ready",
    });
  });

  it("returns the current request error", () => {
    const sources = createSources();

    expect(
      getCurrentGameReviewAsyncState(
        createErrorGameReviewRequestState("review-1", sources, "Review failed"),
        sources,
        true,
      ),
    ).toEqual({
      errorMessage: "Review failed",
      status: "error",
    });
  });
});

function createSources(): GameReviewRequestSources {
  return {
    moveHistory: [],
    players: createMatchPlayerSettings("onePlayer", "level1", "black"),
    winner: "black",
  };
}

function createReview(): GameReview {
  return {
    highlights: {
      badMoves: [],
      goodMoves: [],
    },
    moveCount: 0,
    reviewedDisc: "black",
    reviewedMoves: [],
  };
}
