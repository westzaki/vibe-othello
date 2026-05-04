import { describe, expect, it } from "vitest";
import { createEmptyBoard, type SquareIndex } from "../game/othello";
import type { GameReview, MoveReviewKind, ReviewedMove } from "./reviewTypes";
import { createReviewLesson } from "./createReviewLesson";

describe("createReviewLesson", () => {
  it("chooses one nice move and one turning point from existing highlights", () => {
    const niceMove = createReviewedMove({
      kind: "good",
      moveNumber: 12,
      reasons: ["mobilityGain"],
      square: 20,
    });
    const turningPoint = createReviewedMove({
      bestSquare: 45,
      kind: "bad",
      moveNumber: 8,
      square: 44,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [turningPoint],
        goodMoves: [niceMove],
      }),
    );

    expect(lesson.niceMove).toBe(niceMove);
    expect(lesson.turningPointCandidate).toBe(turningPoint);
    expect(lesson.practiceTarget).toBe(turningPoint);
    expect(lesson.cards.map((card) => card.title)).toEqual([
      "今日のナイス",
      "ここが分かれ道だったかも",
      "ここから練習",
    ]);
  });

  it("does not turn a nice move into the practice target", () => {
    const niceMove = createReviewedMove({
      kind: "good",
      moveNumber: 12,
      reasons: ["mobilityGain"],
      square: 26,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [niceMove],
      }),
    );

    expect(lesson.turningPointCandidate).toBeNull();
    expect(lesson.practiceTarget).toBeNull();
    expect(lesson.cards[2].move).toBeNull();
  });

  it("keeps all lesson moves empty when there are no highlighted moves", () => {
    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [],
      }),
    );

    expect(lesson.niceMove).toBeNull();
    expect(lesson.turningPointCandidate).toBeNull();
    expect(lesson.practiceTarget).toBeNull();
    expect(lesson.cards.every((card) => card.move === null)).toBe(true);
  });

  it("does not force a very early ordinary move into the nice move card", () => {
    const earlyMove = createReviewedMove({
      kind: "good",
      moveNumber: 1,
      reasons: ["nearBestMove"],
      square: 19,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [earlyMove],
      }),
    );

    expect(lesson.niceMove).toBeNull();
    expect(lesson.cards[0].move).toBeNull();
  });

  it("uses practice copy only when there is a practice target", () => {
    const turningPoint = createReviewedMove({
      bestSquare: 49,
      kind: "bad",
      moveNumber: 53,
      square: 48,
    });
    const withPractice = createReviewLesson(
      createGameReview({
        badMoves: [turningPoint],
        goodMoves: [],
      }),
    );
    const withoutPractice = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [],
      }),
    );

    expect(withPractice.cards[2].bodyText).toContain("53手目の局面");
    expect(withPractice.cards[2].emptyText).not.toContain(
      "すぐ練習したい局面は少なめ",
    );
    expect(withPractice.cards[2].emptyText).toBe("");
    expect(withPractice.cards[2].actionLabel).toBe("この局面から練習する");
    expect(withPractice.cards.filter((card) => card.footerText).length).toBe(1);
    expect(withoutPractice.cards[2].emptyText).toContain(
      "すぐ練習したい局面は少なめ",
    );
    expect(withoutPractice.cards[2].actionLabel).toBeUndefined();
  });

  it("prioritizes turningPoint for the turning point card", () => {
    const scoreDrop = createReviewedMove({
      kind: "bad",
      moveNumber: 24,
      playedScore: -100,
      reasons: ["scoreDrop"],
      square: 20,
    });
    const turningPoint = createReviewedMove({
      bestSquare: 22,
      kind: "bad",
      moveNumber: 30,
      playedScore: -20,
      reasons: ["turningPoint"],
      square: 21,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [scoreDrop, turningPoint],
        goodMoves: [],
      }),
    );

    expect(lesson.turningPointCandidate).toBe(turningPoint);
    expect(lesson.practiceTarget).toBe(turningPoint);
  });

  it("keeps practice target empty when the turning point has no trial move", () => {
    const turningPoint = createReviewedMove({
      bestSquare: null,
      kind: "bad",
      moveNumber: 30,
      reasons: ["turningPoint"],
      square: 21,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [turningPoint],
        goodMoves: [],
      }),
    );

    expect(lesson.turningPointCandidate).toBe(turningPoint);
    expect(lesson.practiceTarget).toBeNull();
    expect(lesson.cards[2].move).toBeNull();
    expect(lesson.cards[2].actionLabel).toBeUndefined();
  });
});

function createGameReview({
  badMoves,
  goodMoves,
}: {
  badMoves: ReviewedMove[];
  goodMoves: ReviewedMove[];
}): GameReview {
  return {
    reviewedDisc: "black",
    reviewedMoves: [...goodMoves, ...badMoves],
    highlights: {
      badMoves,
      goodMoves,
    },
  };
}

function createReviewedMove({
  bestSquare,
  kind,
  moveNumber,
  playedScore = 0,
  reasons,
  square,
}: {
  bestSquare?: SquareIndex | null;
  kind: MoveReviewKind;
  moveNumber: number;
  playedScore?: number;
  reasons?: ReviewedMove["review"]["reasons"];
  square: SquareIndex;
}): ReviewedMove {
  const board = createEmptyBoard();
  const reviewedBestSquare = bestSquare === undefined ? square : bestSquare;

  return {
    boardAfter: board,
    boardBefore: board,
    candidateMoves: [],
    disc: "black",
    flippedSquares: [],
    legalMovesBefore: [square],
    moveNumber,
    review: {
      bestScore: reviewedBestSquare === null ? null : 0,
      bestSquare: reviewedBestSquare,
      disc: "black",
      kind,
      moveNumber,
      playedScore,
      reasons: reasons ?? (kind === "bad" ? ["scoreDrop"] : ["bestMove"]),
      scoreAfter: 0,
      scoreBefore: 0,
      square,
    },
    square,
  };
}
