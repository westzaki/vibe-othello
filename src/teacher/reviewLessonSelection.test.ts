import { describe, expect, it } from "vitest";
import { createEmptyBoard, type SquareIndex } from "../game/othello";
import type {
  MoveReviewKind,
  MoveReviewReason,
  ReviewedMove,
} from "./reviewTypes";
import {
  selectNiceMove,
  selectPracticeTarget,
  selectTurningPointCandidate,
} from "./reviewLessonSelection";

describe("review lesson selection", () => {
  it("prioritizes turningPoint plus cornerGiven for the turning point card", () => {
    const dangerSquare = createReviewedMove({
      kind: "bad",
      moveNumber: 32,
      playedScore: -120,
      reasons: ["dangerSquare"],
      square: 9,
    });
    const turningCorner = createReviewedMove({
      kind: "bad",
      moveNumber: 40,
      playedScore: -20,
      reasons: ["turningPoint", "cornerGiven"],
      square: 48,
    });

    expect(selectTurningPointCandidate([dangerSquare, turningCorner])).toBe(
      turningCorner,
    );
  });

  it("prioritizes turningPoint plus dangerSquare over cornerGiven alone", () => {
    const cornerGiven = createReviewedMove({
      kind: "bad",
      moveNumber: 28,
      playedScore: -120,
      reasons: ["cornerGiven"],
      square: 48,
    });
    const turningDanger = createReviewedMove({
      kind: "bad",
      moveNumber: 34,
      playedScore: -20,
      reasons: ["turningPoint", "dangerSquare"],
      square: 9,
    });

    expect(selectTurningPointCandidate([cornerGiven, turningDanger])).toBe(
      turningDanger,
    );
  });

  it("prioritizes cornerGiven over a larger plain score gap", () => {
    const plainScoreDrop = createReviewedMove({
      kind: "bad",
      moveNumber: 42,
      playedScore: -140,
      reasons: ["scoreDrop"],
      square: 20,
    });
    const cornerGiven = createReviewedMove({
      kind: "bad",
      moveNumber: 44,
      playedScore: -30,
      reasons: ["cornerGiven"],
      square: 48,
    });

    expect(selectTurningPointCandidate([plainScoreDrop, cornerGiven])).toBe(
      cornerGiven,
    );
  });

  it("uses mobilityLoss before a plain score gap when choosing a learning issue", () => {
    const plainScoreDrop = createReviewedMove({
      kind: "bad",
      moveNumber: 42,
      playedScore: -140,
      reasons: ["scoreDrop"],
      square: 20,
    });
    const mobilityLoss = createReviewedMove({
      kind: "bad",
      moveNumber: 44,
      playedScore: -30,
      reasons: ["mobilityLoss"],
      square: 21,
    });

    expect(selectTurningPointCandidate([plainScoreDrop, mobilityLoss])).toBe(
      mobilityLoss,
    );
  });

  it("does not choose an early ordinary nearBestMove as niceMove", () => {
    const earlyNearBest = createReviewedMove({
      kind: "good",
      moveNumber: 3,
      reasons: ["nearBestMove"],
      square: 19,
    });

    expect(selectNiceMove([earlyNearBest])).toBeNull();
  });

  it("does not choose a plain bestMove as niceMove without an explainable reason", () => {
    const plainBestMove = createReviewedMove({
      kind: "good",
      moveNumber: 20,
      reasons: ["bestMove"],
      square: 20,
    });

    expect(selectNiceMove([plainBestMove])).toBeNull();
  });

  it("chooses an explainable niceMove when one exists", () => {
    const plainBestMove = createReviewedMove({
      kind: "good",
      moveNumber: 20,
      reasons: ["bestMove"],
      square: 20,
    });
    const mobilityGain = createReviewedMove({
      kind: "good",
      moveNumber: 24,
      reasons: ["mobilityGain"],
      square: 21,
    });

    expect(selectNiceMove([plainBestMove, mobilityGain])).toBe(mobilityGain);
  });

  it("uses the turning point as practice target only when a trial move exists", () => {
    const turningPoint = createReviewedMove({
      bestSquare: 26,
      kind: "bad",
      moveNumber: 40,
      reasons: ["turningPoint"],
      square: 20,
    });
    const noTrialMove = createReviewedMove({
      bestSquare: null,
      kind: "bad",
      moveNumber: 44,
      reasons: ["cornerGiven"],
      square: 21,
    });

    expect(selectPracticeTarget(turningPoint)).toBe(turningPoint);
    expect(selectPracticeTarget(noTrialMove)).toBeNull();
    expect(selectPracticeTarget(null)).toBeNull();
  });
});

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
  reasons: MoveReviewReason[];
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
      reasons,
      scoreAfter: 0,
      scoreBefore: 0,
      square,
    },
    square,
  };
}
