import { describe, expect, it } from "vitest";
import { calibratePlayPositionAdvantage } from "./playAdvantageCalibration";
import type { CandidateMoveReview } from "./reviewTypes";

describe("play advantage calibration", () => {
  it("pulls opening search outlooks toward neutral", () => {
    expect(
      calibratePlayPositionAdvantage({
        advantage: {
          blackPercent: 70,
          leadingDisc: "black",
          whitePercent: 30,
        },
        bestCandidate: null,
        candidateMoves: [],
        currentDisc: "black",
        phase: "opening",
        source: "searchAdjusted",
      }),
    ).toEqual({
      blackPercent: 55,
      leadingDisc: "black",
      whitePercent: 45,
    });
  });

  it("keeps close candidate races less assertive", () => {
    const bestCandidate = createCandidate({
      metrics: {
        scoreGapFromBest: 0,
      },
      rank: 1,
      score: 100,
      square: 19,
    });
    const secondCandidate = createCandidate({
      metrics: {
        scoreGapFromBest: 4,
      },
      rank: 2,
      score: 96,
      square: 26,
    });

    expect(
      calibratePlayPositionAdvantage({
        advantage: {
          blackPercent: 64,
          leadingDisc: "black",
          whitePercent: 36,
        },
        bestCandidate,
        candidateMoves: [bestCandidate, secondCandidate],
        currentDisc: "black",
        phase: "midgame",
        source: "searchAdjusted",
      }),
    ).toEqual({
      blackPercent: 58,
      leadingDisc: "black",
      whitePercent: 42,
    });
  });

  it("discounts a best candidate that gives the opponent corner access", () => {
    const safeCandidate = createCandidate({
      rank: 1,
      score: 100,
      square: 19,
    });
    const riskyCandidate = createCandidate({
      metrics: {
        givesOpponentCorner: true,
      },
      rank: 1,
      reasons: ["cornerGiven"],
      score: 100,
      square: 9,
    });

    const safeAdvantage = calibratePlayPositionAdvantage({
      advantage: {
        blackPercent: 60,
        leadingDisc: "black",
        whitePercent: 40,
      },
      bestCandidate: safeCandidate,
      candidateMoves: [safeCandidate],
      currentDisc: "black",
      phase: "midgame",
      source: "searchAdjusted",
    });
    const riskyAdvantage = calibratePlayPositionAdvantage({
      advantage: {
        blackPercent: 60,
        leadingDisc: "black",
        whitePercent: 40,
      },
      bestCandidate: riskyCandidate,
      candidateMoves: [riskyCandidate],
      currentDisc: "black",
      phase: "midgame",
      source: "searchAdjusted",
    });

    expect(safeAdvantage.blackPercent).toBe(59);
    expect(riskyAdvantage.blackPercent).toBe(52);
  });

  it("does not alter exact endgame advantage", () => {
    const advantage = {
      blackPercent: 100,
      leadingDisc: "black" as const,
      whitePercent: 0,
    };

    expect(
      calibratePlayPositionAdvantage({
        advantage,
        bestCandidate: createCandidate({
          rank: 1,
          score: 100,
          square: 19,
        }),
        candidateMoves: [],
        currentDisc: "black",
        phase: "endgame",
        source: "exactEndgame",
      }),
    ).toBe(advantage);
  });
});

function createCandidate({
  metrics = {},
  rank,
  reasons = [],
  score,
  square,
}: Pick<CandidateMoveReview, "rank" | "score" | "square"> & {
  metrics?: Partial<CandidateMoveReview["metrics"]>;
  reasons?: CandidateMoveReview["reasons"];
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
      mobilitySwing: 0,
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
      ...metrics,
    },
    rank,
    reasons,
    score,
    square,
  };
}
