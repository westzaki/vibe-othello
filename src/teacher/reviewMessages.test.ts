import { describe, expect, it } from "vitest";
import { createEmptyBoard, type Board, type SquareIndex } from "../game/othello";
import { placeCurrentDisc, startNewGame } from "../game/session";
import { createBoardFixture } from "../test/boardFixtures";
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
    ["turningPoint" as const, "流れ", "相手のチャンス"],
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

  it("creates soft turning point copy", () => {
    const message = createMoveReviewMessage({
      bestScore: 18,
      bestSquare: 26,
      disc: "black",
      kind: "bad",
      playedScore: -12,
      moveNumber: 24,
      reasons: ["turningPoint"],
      scoreAfter: -12,
      scoreBefore: 30,
      square: 19,
    });

    expect(message.explanation).toContain("流れが変わったかも");
    expect(message.explanation).not.toContain("悪手");
    expect(message.explanation).not.toContain("ミス");
    expect(message.explanation).not.toContain("ダメ");
  });

  it("uses endgame copy when a bad move was reviewed with exact endgame evaluation", () => {
    const message = createMoveReviewMessage(
      createReviewedMove({
        bestSquare: 0,
        boardBefore: createEndgameBoard(),
        candidateReasons: [],
        reasons: ["missedBestMove", "scoreDrop"],
        square: 2,
      }),
    );

    expect(message.explanation).toContain("終盤");
    expect(message.explanation).toContain("最後まで");
    expect(message.suggestion).toContain("この終盤");
    expect(message.comparison?.playedMove.explanation).toContain(
      "最後まで",
    );
    expect(message.comparison?.trialMove?.explanation).toContain("最後まで");
    expect(message.comparison?.nextFocus).toContain("最後に残る石数");
  });

  it("uses endgame advice when a highlighted bad move came from exact endgame evaluation", () => {
    const reviewedMove = createReviewedMove({
      bestSquare: 0,
      boardBefore: createEndgameBoard(),
      candidateReasons: [],
      reasons: ["missedBestMove", "scoreDrop"],
      square: 2,
    });
    const messages = createGameReviewMessages({
      highlights: {
        badMoves: [reviewedMove],
        goodMoves: [],
      },
      moveCount: reviewedMove.moveNumber,
      reviewedDisc: "black",
      reviewedMoves: [reviewedMove],
    });

    expect(messages.advice).toContain("終盤");
    expect(messages.advice).toContain("最後に石が残る手");
  });
});

function createReviewedMove({
  bestSquare,
  boardBefore = createEmptyBoard(),
  candidateReasons,
  reasons,
  square,
}: {
  bestSquare: SquareIndex | null;
  boardBefore?: Board;
  candidateReasons: MoveReviewReason[];
  reasons: MoveReviewReason[];
  square: SquareIndex;
}): ReviewedMove {
  const boardAfter = [...boardBefore];

  return {
    boardAfter,
    boardBefore,
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

function createEndgameBoard(): Board {
  return createBoardFixture(
    {
      0: null,
      1: null,
      2: null,
    },
    "black",
  );
}
