import { describe, expect, it } from "vitest";
import { createInitialBoard } from "../game/othello";
import type { CandidateMoveReview } from "./reviewTypes";
import {
  chooseTeacherGuidanceMove,
  selectTeacherDeepeningCandidates,
  shouldUseTeacherExactEndgameByCounts,
} from "./teacherGuidanceMove";

describe("teacher guidance move", () => {
  it("uses variable exact endgame thresholds from empty and legal move counts", () => {
    expect(shouldUseTeacherExactEndgameByCounts(10, 8)).toBe(true);
    expect(shouldUseTeacherExactEndgameByCounts(12, 4)).toBe(true);
    expect(shouldUseTeacherExactEndgameByCounts(12, 5)).toBe(false);
    expect(shouldUseTeacherExactEndgameByCounts(14, 3)).toBe(true);
    expect(shouldUseTeacherExactEndgameByCounts(14, 4)).toBe(false);
  });

  it("deepens top candidates and tactically important candidates", () => {
    const candidates = [
      createCandidateMove({ rank: 1, score: 100, square: 19 }),
      createCandidateMove({ rank: 5, score: 70, square: 9 }),
      createCandidateMove({
        metrics: { givesOpponentCorner: true, scoreGapFromBest: 80 },
        rank: 6,
        score: 20,
        square: 10,
      }),
      createCandidateMove({
        metrics: { mobilitySwing: -5, scoreGapFromBest: 85 },
        rank: 7,
        score: 15,
        square: 11,
      }),
    ];

    expect(selectTeacherDeepeningCandidates(candidates, 1)).toEqual([
      candidates[0],
      candidates[1],
      candidates[2],
      candidates[3],
    ]);
  });

  it("returns a legal teacher guidance move", () => {
    expect(
      chooseTeacherGuidanceMove(createInitialBoard(), "black", {
        deepSearchDepth: 3,
        shallowSearchDepth: 1,
      }),
    ).toEqual(expect.any(Number));
  });
});

function createCandidateMove({
  metrics = {},
  rank,
  score,
  square,
}: Pick<CandidateMoveReview, "rank" | "score" | "square"> & {
  metrics?: Partial<CandidateMoveReview["metrics"]>;
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
      opponentMobilityAfter: 0,
      opponentMobilityBefore: 0,
      opponentMobilityDelta: 0,
      playerMobilityAfter: 0,
      playerMobilityBefore: 0,
      playerMobilityDelta: 0,
      scoreGapFromBest: Math.max(0, 100 - score),
      ...metrics,
    },
    rank,
    reasons: [],
    score,
    square,
  };
}
