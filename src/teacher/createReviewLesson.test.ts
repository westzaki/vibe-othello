import { describe, expect, it } from "vitest";
import { createEmptyBoard, type SquareIndex } from "../game/othello";
import type {
  GameReview,
  MoveReviewKind,
  ReviewEvaluationSource,
  ReviewedMove,
} from "./reviewTypes";
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
      "loss",
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
      "loss",
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
      "loss",
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
      "loss",
    );

    expect(lesson.niceMove).toBeNull();
    expect(lesson.cards[0].move).toBeNull();
  });

  it("describes the nice move by its learning reason", () => {
    const mobilityMove = createReviewedMove({
      kind: "good",
      moveNumber: 14,
      reasons: ["mobilityGain"],
      square: 26,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [mobilityMove],
      }),
      "loss",
    );

    expect(lesson.cards[0].bodyText).toContain("相手の置ける場所");
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
      "loss",
    );
    const withoutPractice = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [],
      }),
      "loss",
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
      "loss",
    );

    expect(lesson.turningPointCandidate).toBe(turningPoint);
    expect(lesson.practiceTarget).toBe(turningPoint);
  });

  it("describes corner-risk turning points with matching practice focus", () => {
    const cornerRisk = createReviewedMove({
      bestSquare: 45,
      kind: "bad",
      moveNumber: 30,
      reasons: ["cornerGiven"],
      square: 44,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [cornerRisk],
        goodMoves: [],
      }),
      "loss",
    );

    expect(lesson.cards[1].bodyText).toContain("角チャンス");
    expect(lesson.cards[2].bodyText).toContain("角チャンス");
  });

  it("describes mobility-loss practice focus with legal move wording", () => {
    const mobilityLoss = createReviewedMove({
      bestSquare: 45,
      kind: "bad",
      moveNumber: 30,
      reasons: ["mobilityLoss"],
      square: 44,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [mobilityLoss],
        goodMoves: [],
      }),
      "loss",
    );

    expect(lesson.cards[1].bodyText).toContain("置ける場所");
    expect(lesson.cards[2].bodyText).toContain("置ける場所");
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
      "loss",
    );

    expect(lesson.turningPointCandidate).toBe(turningPoint);
    expect(lesson.practiceTarget).toBeNull();
    expect(lesson.cards[2].move).toBeNull();
    expect(lesson.cards[2].actionLabel).toBeUndefined();
  });

  it("creates a win lesson centered on reproducible good decisions", () => {
    const niceMove = createReviewedMove({
      kind: "good",
      moveNumber: 18,
      reasons: ["mobilityGain"],
      square: 26,
    });
    const turningPoint = createReviewedMove({
      bestSquare: 45,
      kind: "bad",
      moveNumber: 30,
      square: 44,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [turningPoint],
        goodMoves: [niceMove],
      }),
      "win",
    );

    expect(lesson.cards.map((card) => card.title)).toEqual([
      "勝てたポイント",
      "次も使ってみよう",
    ]);
    expect(lesson.cards.map((card) => card.title)).not.toContain(
      "ここが分かれ道だったかも",
    );
    expect(lesson.cards.map((card) => card.title)).not.toContain(
      "今日のナイス",
    );
    expect(lesson.niceMove).toBe(niceMove);
    expect(lesson.turningPointCandidate).toBe(niceMove);
    expect(lesson.practiceTarget).toBeNull();
    expect(lesson.cards[1].move).toBeNull();
    expect(lesson.cards[1].actionLabel).toBeUndefined();
  });

  it("describes win lessons by the reproducible winning reason", () => {
    const mobilityMove = createReviewedMove({
      kind: "good",
      moveNumber: 18,
      reasons: ["mobilityGain"],
      square: 26,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [mobilityMove],
      }),
      "win",
    );

    expect(lesson.cards[0].bodyText).toContain("相手の置ける場所");
  });

  it("does not use the final reviewed move as the win lesson point", () => {
    const earlierGoodMove = createReviewedMove({
      kind: "good",
      moveNumber: 24,
      reasons: ["mobilityGain"],
      square: 26,
    });
    const finalCornerMove = createReviewedMove({
      kind: "good",
      moveNumber: 60,
      reasons: ["corner"],
      square: 63,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [finalCornerMove, earlierGoodMove],
        moveCount: 60,
      }),
      "win",
    );

    expect(lesson.niceMove).toBe(earlierGoodMove);
    expect(lesson.turningPointCandidate).toBe(earlierGoodMove);
    expect(lesson.cards[0].move).toBe(earlierGoodMove);
  });

  it("falls back to an earlier reproducible move for win lessons", () => {
    const earlierBestMove = createReviewedMove({
      kind: "good",
      moveNumber: 18,
      reasons: ["bestMove"],
      square: 20,
    });
    const finalCornerMove = createReviewedMove({
      kind: "good",
      moveNumber: 60,
      reasons: ["corner"],
      square: 63,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [],
        goodMoves: [finalCornerMove],
        moveCount: 60,
        reviewedMoves: [earlierBestMove, finalCornerMove],
      }),
      "win",
    );

    expect(lesson.niceMove).toBeNull();
    expect(lesson.turningPointCandidate).toBe(earlierBestMove);
    expect(lesson.cards[0].move).toBe(earlierBestMove);
  });

  it("keeps the learning lesson for draw while using selected focus copy", () => {
    const turningPoint = createReviewedMove({
      bestSquare: 45,
      kind: "bad",
      moveNumber: 30,
      square: 44,
    });

    const lesson = createReviewLesson(
      createGameReview({
        badMoves: [turningPoint],
        goodMoves: [],
      }),
      "draw",
    );

    expect(lesson.cards.map((card) => card.title)).toEqual([
      "今日のナイス",
      "ここが分かれ道だったかも",
      "ここから練習",
    ]);
    expect(lesson.cards[1].bodyText).toContain("相手のチャンス");
    expect(lesson.practiceTarget).toBe(turningPoint);
    expect(lesson.cards[2].actionLabel).toBe("この局面から練習する");
  });
});

function createGameReview({
  badMoves,
  goodMoves,
  moveCount,
  reviewedMoves,
}: {
  badMoves: ReviewedMove[];
  goodMoves: ReviewedMove[];
  moveCount?: number;
  reviewedMoves?: ReviewedMove[];
}): GameReview {
  const reviewMoves = reviewedMoves ?? [...goodMoves, ...badMoves];

  return {
    moveCount:
      moveCount ??
      Math.max(0, ...reviewMoves.map((move) => move.moveNumber)) + 4,
    reviewedDisc: "black",
    reviewedMoves: reviewMoves,
    highlights: {
      badMoves,
      goodMoves,
    },
  };
}

function createReviewedMove({
  bestSquare,
  evaluationSource = "minimax",
  kind,
  moveNumber,
  playedScore = 0,
  reasons,
  square,
}: {
  bestSquare?: SquareIndex | null;
  evaluationSource?: ReviewEvaluationSource;
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
      evaluationSource,
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
