import { describe, expect, it } from "vitest";
import { placeCurrentDisc, startNewGame } from "../game/session";
import { reviewGame } from "../teacher";
import { reviewGameAsync } from "./reviewService";

describe("review service", () => {
  it("returns a review through an async app-facing API", async () => {
    const session = placeCurrentDisc(startNewGame(), 19).session;
    const options = {
      reviewedDisc: "black",
      searchDepth: 1,
    } as const;

    const response = await reviewGameAsync({
      moveHistory: session.moveHistory,
      options,
      requestId: "review-opening",
    });

    expect(response).toEqual({
      requestId: "review-opening",
      review: reviewGame(session.moveHistory, options),
    });
  });
});
