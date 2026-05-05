import { describe, expect, it } from "vitest";
import { createInitialBoard } from "../game/othello";
import { createBoardFixture } from "../test/boardFixtures";
import {
  createCoachHint,
  createCoachHints,
  createCoachHintsFromAnalysis,
} from "./createCoachHint";
import type { CandidateMoveReview } from "./reviewTypes";

describe("teacher coach hints", () => {
  it("returns null when there are no candidate moves", () => {
    const board = createBoardFixture({}, "black");

    expect(createCoachHint(board, "black")).toBeNull();
  });

  it("points out a corner opportunity without forcing a best-move tone", () => {
    const board = createBoardFixture({
      1: "white",
      2: "black",
    });
    const hint = createCoachHint(board, "black", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "cornerOpportunity",
        reasons: expect.arrayContaining(["corner"]),
        square: 0,
      }),
    );
    expect(hint?.message).toContain("角を取れる場所");
    expect(hint?.message).not.toContain("正解");
    expect(hint?.message).not.toContain("最善");
  });

  it("warns about candidate moves that may give the opponent a corner", () => {
    const board = createBoardFixture({
      10: "white",
      11: "black",
      18: "white",
      27: "white",
      28: "black",
    });
    const hint = createCoachHint(board, "black", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "cornerRisk",
        reasons: expect.arrayContaining(["cornerGiven"]),
        square: 9,
      }),
    );
    expect(hint?.message).toContain("角の近く");
  });

  it("does not warn about a danger square when its score is near the best candidate", () => {
    const hints = createCoachHintsFromAnalysis({
      candidateMoves: [
        createCandidateMove({
          rank: 1,
          reasons: [],
          score: 100,
          square: 19,
        }),
        createCandidateMove({
          metrics: {
            isDangerSquare: true,
            scoreGapFromBest: 2,
          },
          rank: 2,
          reasons: ["dangerSquare"],
          score: 98,
          square: 9,
        }),
      ],
      evaluationSource: "minimax",
    });

    expect(hints).toEqual([]);
  });

  it("can include a warning and a helpful hint together", () => {
    const board = createBoardFixture({
      1: "white",
      2: "black",
      10: "white",
      11: "black",
    });
    const hints = createCoachHints(board, "black", {
      searchDepth: 1,
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: "mobilityRisk",
        square: 9,
      }),
      expect.objectContaining({
        kind: "cornerOpportunity",
        square: 0,
      }),
    ]);
  });

  it("warns about moves that meaningfully reduce current player mobility", () => {
    const board = createBoardFixture({
      1: "black",
      9: "black",
      17: "black",
      18: "white",
      19: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    });
    const hints = createCoachHints(board, "white", {
      includeCandidateFallback: true,
      searchDepth: 1,
    });

    expect(hints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "mobilityRisk",
          reasons: expect.arrayContaining(["mobilityLoss"]),
          square: 11,
        }),
      ]),
    );
  });

  it("uses mobility gain when no corner hint is more important", () => {
    const board = createBoardFixture({
      18: "white",
      19: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    });
    const hint = createCoachHint(board, "black", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "mobility",
        reasons: expect.arrayContaining(["mobilityGain"]),
        square: 26,
      }),
    );
    expect(hint?.message).toContain("動きづらく");
  });

  it("can use a corner candidate even when it is not the top scored move", () => {
    const hints = createCoachHintsFromAnalysis({
      candidateMoves: [
        createCandidateMove({
          rank: 1,
          reasons: [],
          score: 100,
          square: 19,
        }),
        createCandidateMove({
          metrics: {
            isCorner: true,
            scoreGapFromBest: 12,
          },
          rank: 2,
          reasons: ["corner"],
          score: 88,
          square: 0,
        }),
      ],
      evaluationSource: "minimax",
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: "cornerOpportunity",
        square: 0,
      }),
    ]);
  });

  it("can use a close mobility gain candidate even when the top scored move is plain", () => {
    const hints = createCoachHintsFromAnalysis({
      candidateMoves: [
        createCandidateMove({
          rank: 1,
          reasons: [],
          score: 100,
          square: 19,
        }),
        createCandidateMove({
          metrics: {
            mobilitySwing: 4,
            scoreGapFromBest: 8,
          },
          rank: 2,
          reasons: ["mobilityGain"],
          score: 92,
          square: 26,
        }),
      ],
      evaluationSource: "minimax",
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: "mobility",
        square: 26,
      }),
    ]);
  });

  it("does not suggest a distant mobility gain candidate as a helpful hint", () => {
    const hints = createCoachHintsFromAnalysis({
      candidateMoves: [
        createCandidateMove({
          rank: 1,
          reasons: [],
          score: 100,
          square: 19,
        }),
        createCandidateMove({
          metrics: {
            mobilitySwing: 4,
            scoreGapFromBest: 80,
          },
          rank: 2,
          reasons: ["mobilityGain"],
          score: 20,
          square: 26,
        }),
      ],
      evaluationSource: "minimax",
    });

    expect(hints).toEqual([]);
  });

  it("can fall back to a candidate hint for active coaching", () => {
    const board = createInitialBoard();

    expect(createCoachHint(board, "black", { searchDepth: 1 })).toBeNull();

    const hint = createCoachHint(board, "black", {
      includeCandidateFallback: true,
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "candidate",
        square: expect.any(Number),
      }),
    );
    expect(hint?.message).toContain("後の形");
  });

  it("uses an endgame hint when the analysis is exact endgame", () => {
    const board = createBoardFromString(
      "wwwwb-b-wbbwbbwwwbwbbbbbwwwbbwbww-bwwbww-wwwbwb-bwwbbbw-ww-w--ww",
    );
    const hint = createCoachHint(board, "white", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "endgame",
        square: expect.any(Number),
      }),
    );
    expect(hint?.message).toContain("終盤");
  });
});

function createBoardFromString(source: string) {
  return Array.from(source, (cell) => {
    if (cell === "b") {
      return "black";
    }

    if (cell === "w") {
      return "white";
    }

    return null;
  });
}

function createCandidateMove({
  metrics = {},
  rank,
  reasons,
  score,
  square,
}: Pick<CandidateMoveReview, "rank" | "reasons" | "score" | "square"> & {
  metrics?: Partial<CandidateMoveReview["metrics"]>;
}): CandidateMoveReview {
  return {
    metrics: {
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
      scoreGapFromBest: 0,
      ...metrics,
    },
    rank,
    reasons,
    score,
    square,
  };
}
