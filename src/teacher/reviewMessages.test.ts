import { describe, expect, it } from "vitest";
import { placeCurrentDisc, startNewGame } from "../game/session";
import { reviewGame } from "./reviewGame";
import { createGameReviewMessages } from "./reviewMessages";

describe("teacher review messages", () => {
  it("creates Japanese display text from structured review data", () => {
    const session = placeCurrentDisc(startNewGame(), 19).session;
    const review = reviewGame(session.moveHistory, {
      reviewedDisc: "black",
      searchDepth: 1,
    });

    const messages = createGameReviewMessages(review);

    expect(messages.advice).not.toHaveLength(0);
    expect(messages.moveMessages.get(1)?.explanation).not.toHaveLength(0);
  });
});
