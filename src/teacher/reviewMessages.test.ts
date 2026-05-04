import { describe, expect, it } from "vitest";
import { createEmptyBoard, type SquareIndex } from "../game/othello";
import { placeCurrentDisc, startNewGame } from "../game/session";
import { reviewGame } from "./reviewGame";
import {
  createGameReviewMessages,
  createMoveReviewMessage,
} from "./reviewMessages";
import type { MoveReviewReason, ReviewedMove } from "./reviewTypes";

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

  it("creates a clear played vs trial comparison for a bad reviewed move", () => {
    const message = createMoveReviewMessage(
      createReviewedMove({
        bestSquare: 58,
        candidateReasons: ["mobilityGain"],
        reasons: ["cornerGiven"],
        square: 48,
      }),
    );

    expect(message.comparison?.playedMove).toEqual(
      expect.objectContaining({
        explanation: expect.stringContaining("相手が角へ近づける"),
        playedScore: -12,
        reasons: ["cornerGiven"],
        square: 48,
      }),
    );
    expect(message.comparison?.trialMove).toEqual(
      expect.objectContaining({
        bestScore: 18,
        explanation: expect.stringContaining("角まわりのリスク"),
        reasons: ["mobilityGain"],
        square: 58,
      }),
    );
    expect(message.comparison?.nextFocus).toContain("角チャンス");
  });

  it("keeps comparison display safe when there is no trial move", () => {
    const message = createMoveReviewMessage(
      createReviewedMove({
        bestSquare: null,
        candidateReasons: [],
        reasons: ["scoreDrop"],
        square: 48,
      }),
    );

    expect(message.comparison?.playedMove.square).toBe(48);
    expect(message.comparison?.trialMove).toBeNull();
    expect(message.comparison?.nextFocus).not.toHaveLength(0);
  });

  it.each([
    ["cornerGiven" as const, "相手が角へ近づける", "角チャンス"],
    ["dangerSquare" as const, "角の近く", "空いている角"],
    ["mobilityLoss" as const, "置ける場所", "自分と相手"],
  ])("uses a natural comparison for %s", (reason, playedText, focusText) => {
    const message = createMoveReviewMessage(
      createReviewedMove({
        bestSquare: 58,
        candidateReasons: [],
        reasons: [reason],
        square: 48,
      }),
    );

    expect(message.comparison?.playedMove.explanation).toContain(playedText);
    expect(message.comparison?.nextFocus).toContain(focusText);
  });
});

function createReviewedMove({
  bestSquare,
  candidateReasons,
  reasons,
  square,
}: {
  bestSquare: SquareIndex | null;
  candidateReasons: MoveReviewReason[];
  reasons: MoveReviewReason[];
  square: SquareIndex;
}): ReviewedMove {
  const board = createEmptyBoard();

  return {
    boardAfter: board,
    boardBefore: board,
    candidateMoves:
      bestSquare === null
        ? []
        : [
            {
              rank: 1,
              reasons: candidateReasons,
              score: 18,
              square: bestSquare,
            },
          ],
    disc: "black",
    flippedSquares: [],
    legalMovesBefore: bestSquare === null ? [square] : [square, bestSquare],
    moveNumber: 53,
    review: {
      bestScore: bestSquare === null ? null : 18,
      bestSquare,
      disc: "black",
      kind: "bad",
      moveNumber: 53,
      playedScore: -12,
      reasons,
      scoreAfter: -12,
      scoreBefore: 4,
      square,
    },
    square,
  };
}
