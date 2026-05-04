import { describe, expect, it } from "vitest";
import { placeCurrentDisc, startNewGame } from "../game/session";
import { reviewGame } from "./reviewGame";
import {
  createGameReviewMessages,
  createMoveReviewMessage,
} from "./reviewMessages";

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

  it("keeps bad move copy soft and free of numeric score gaps", () => {
    const message = createMoveReviewMessage({
      bestScore: 18,
      bestSquare: 0,
      disc: "black",
      kind: "bad",
      playedScore: -12,
      moveNumber: 12,
      reasons: ["scoreDrop"],
      scoreAfter: -12,
      scoreBefore: 4,
      square: 19,
    });

    expect(message.explanation).toContain("分かれ道");
    expect(message.explanation).not.toContain("点");
    expect(message.explanation).not.toContain("損");
    expect(message.explanation).not.toContain("失着");
  });
});
