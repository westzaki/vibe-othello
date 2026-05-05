import { describe, expect, it } from "vitest";
import { createShapeSignals } from "./playPositionShapeSignals";
import type { CandidateMoveReview } from "./reviewTypes";

describe("createShapeSignals", () => {
  it("prioritizes exact endgame as a neutral high-strength signal", () => {
    const candidate = createCandidate({ square: 20 });

    expect(
      createShapeSignals({
        candidateMoves: [candidate],
        evaluationSource: "exactEndgame",
      }),
    ).toEqual([
      {
        candidate,
        kind: "endgame",
        square: 20,
        strength: "high",
        tone: "neutral",
      },
    ]);
  });

  it("deduplicates danger square signals when a corner risk already exists", () => {
    const cornerRisk = createCandidate({
      reasons: ["cornerGiven"],
      square: 9,
    });
    const dangerSquare = createCandidate({
      reasons: ["dangerSquare"],
      square: 10,
    });

    expect(
      createShapeSignals({
        candidateMoves: [cornerRisk, dangerSquare],
        evaluationSource: "minimax",
      }).map((signal) => signal.kind),
    ).toEqual(["cornerRisk"]);
  });

  it("uses mobility swing size for signal strength", () => {
    const mobilityGain = createCandidate({
      mobilitySwing: 6,
      reasons: ["mobilityGain"],
      square: 19,
    });
    const mobilityLoss = createCandidate({
      mobilitySwing: -3,
      reasons: ["mobilityLoss"],
      square: 26,
    });

    expect(
      createShapeSignals({
        candidateMoves: [mobilityGain, mobilityLoss],
        evaluationSource: "minimax",
      }).map(({ kind, strength, tone }) => ({ kind, strength, tone })),
    ).toEqual([
      { kind: "mobilityOpportunity", strength: "high", tone: "helpful" },
      { kind: "mobilityRisk", strength: "medium", tone: "risk" },
    ]);
  });
});

function createCandidate({
  mobilitySwing = 0,
  reasons = [],
  square,
}: {
  mobilitySwing?: number;
  reasons?: CandidateMoveReview["reasons"];
  square: CandidateMoveReview["square"];
}): CandidateMoveReview {
  return {
    metrics: {
      anchoredEdgeDelta: 0,
      anchoredEdgeDifferenceAfter: 0,
      anchoredEdgeDifferenceBefore: 0,
      givesOpponentCorner: false,
      isCorner: false,
      isDangerSquare: false,
      mobilityDifferenceAfter: 0,
      mobilityDifferenceBefore: 0,
      mobilitySwing,
      opponentCornerMoveDelta: 0,
      opponentCornerMovesAfter: 0,
      opponentCornerMovesBefore: 0,
      opponentMobilityAfter: 0,
      opponentMobilityBefore: 0,
      opponentMobilityDelta: 0,
      playerMobilityAfter: 0,
      playerMobilityBefore: 0,
      playerMobilityDelta: 0,
      scoreGapFromBest: 0,
    },
    rank: 1,
    reasons,
    score: 0,
    square,
  };
}
