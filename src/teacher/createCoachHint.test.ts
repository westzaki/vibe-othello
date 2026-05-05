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

  it("can return multiple risk hints with severity", () => {
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
            givesOpponentCorner: true,
            scoreGapFromBest: 10,
          },
          rank: 2,
          reasons: ["cornerGiven"],
          score: 90,
          square: 9,
        }),
        createCandidateMove({
          metrics: {
            mobilitySwing: -4,
            scoreGapFromBest: 24,
          },
          rank: 3,
          reasons: ["mobilityLoss"],
          score: 76,
          square: 11,
        }),
        createCandidateMove({
          metrics: {
            isDangerSquare: true,
            scoreGapFromBest: 7,
          },
          rank: 4,
          reasons: ["dangerSquare"],
          score: 93,
          square: 14,
        }),
      ],
      evaluationSource: "minimax",
    });

    expect(hints).toEqual([
      expect.objectContaining({
        kind: "cornerRisk",
        severity: "high",
        square: 9,
      }),
      expect.objectContaining({
        kind: "mobilityRisk",
        severity: "medium",
        square: 11,
      }),
      expect.objectContaining({
        kind: "cornerRisk",
        severity: "low",
        square: 14,
      }),
    ]);
  });

  it("limits risk hints when requested", () => {
    const hints = createCoachHintsFromAnalysis(
      {
        candidateMoves: [
          createCandidateMove({
            rank: 1,
            reasons: [],
            score: 100,
            square: 19,
          }),
          createCandidateMove({
            metrics: {
              givesOpponentCorner: true,
              scoreGapFromBest: 10,
            },
            rank: 2,
            reasons: ["cornerGiven"],
            score: 90,
            square: 9,
          }),
          createCandidateMove({
            metrics: {
              mobilitySwing: -4,
              scoreGapFromBest: 24,
            },
            rank: 3,
            reasons: ["mobilityLoss"],
            score: 76,
            square: 11,
          }),
        ],
        evaluationSource: "minimax",
      },
      {
        riskHintLimit: 1,
      },
    );

    expect(hints).toEqual([
      expect.objectContaining({
        severity: "high",
        square: 9,
      }),
    ]);
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

  it("can put the best move first while keeping learning hints", () => {
    const hints = createCoachHintsFromAnalysis(
      {
        candidateMoves: [
          createCandidateMove({
            rank: 1,
            reasons: [],
            score: 100,
            square: 19,
          }),
          createCandidateMove({
            metrics: {
              givesOpponentCorner: true,
              scoreGapFromBest: 20,
            },
            rank: 2,
            reasons: ["cornerGiven"],
            score: 80,
            square: 9,
          }),
        ],
        evaluationSource: "minimax",
      },
      {
        includeBestMoveHint: true,
      },
    );

    expect(hints).toEqual([
      expect.objectContaining({
        kind: "bestMove",
        square: 19,
      }),
      expect.objectContaining({
        kind: "cornerRisk",
        square: 9,
      }),
    ]);
  });

  it("can use a stronger teacher guidance square as the best move hint", () => {
    const hints = createCoachHintsFromAnalysis(
      {
        candidateMoves: [
          createCandidateMove({
            rank: 1,
            reasons: [],
            score: 100,
            square: 19,
          }),
          createCandidateMove({
            rank: 2,
            reasons: [],
            score: 92,
            square: 26,
          }),
        ],
        evaluationSource: "minimax",
      },
      {
        bestMoveSquare: 26,
        includeBestMoveHint: true,
      },
    );

    expect(hints[0]).toEqual(
      expect.objectContaining({
        kind: "bestMove",
        square: 26,
      }),
    );
  });

  it("carries teacher guidance context into best move hints", () => {
    const hints = createCoachHintsFromAnalysis(
      {
        candidateMoves: [
          createCandidateMove({
            rank: 1,
            reasons: [],
            score: 100,
            square: 19,
          }),
          createCandidateMove({
            metrics: {
              opponentMobilityAfter: 1,
            },
            rank: 2,
            reasons: [],
            score: 96,
            square: 26,
          }),
        ],
        evaluationSource: "minimax",
      },
      {
        bestMoveGuidance: {
          opponentPressureScore: 8,
          opponentReplySpread: 12,
          refutationSeverity: null,
          scoreGapFromBest: 4,
        },
        bestMoveSquare: 26,
        includeBestMoveHint: true,
      },
    );

    expect(hints[0]).toEqual(
      expect.objectContaining({
        guidance: expect.objectContaining({
          opponentPressureScore: 8,
          refutationSeverity: null,
        }),
        kind: "bestMove",
        square: 26,
      }),
    );
    expect(hints[0]?.message).toContain("行き先を絞りやすく");
  });

  it("mentions strong replies when teacher guidance detects refutation risk", () => {
    const hints = createCoachHintsFromAnalysis(
      {
        candidateMoves: [
          createCandidateMove({
            rank: 1,
            reasons: [],
            score: 100,
            square: 19,
          }),
        ],
        evaluationSource: "minimax",
      },
      {
        bestMoveGuidance: {
          opponentPressureScore: 0,
          opponentReplySpread: null,
          refutationSeverity: "high",
          scoreGapFromBest: 0,
        },
        bestMoveSquare: 19,
        includeBestMoveHint: true,
      },
    );

    expect(hints[0]).toEqual(
      expect.objectContaining({
        guidance: expect.objectContaining({
          refutationSeverity: "high",
        }),
        kind: "bestMove",
      }),
    );
    expect(hints[0]?.message).toContain("強い返し");
  });

  it("uses direct reasons for active best-move hints", () => {
    const hints = createCoachHintsFromAnalysis(
      {
        candidateMoves: [
          createCandidateMove({
            metrics: {
              opponentMobilityAfter: 1,
            },
            rank: 1,
            reasons: [],
            score: 100,
            square: 26,
          }),
        ],
        evaluationSource: "minimax",
      },
      {
        bestMoveGuidance: {
          opponentPressureScore: 8,
          opponentReplySpread: 12,
          refutationSeverity: null,
          scoreGapFromBest: 0,
        },
        bestMoveSquare: 26,
        includeBestMoveHint: true,
        messageStyle: "direct",
      },
    );

    expect(hints[0]?.message).toBe(
      "C4 が本命候補。理由: 相手の置ける場所を減らしやすく、強い返しを受けにくいからです。",
    );
  });

  it("uses direct reasons for active risk hints", () => {
    const hints = createCoachHintsFromAnalysis(
      {
        candidateMoves: [
          createCandidateMove({
            rank: 1,
            reasons: [],
            score: 100,
            square: 19,
          }),
          createCandidateMove({
            metrics: {
              givesOpponentCorner: true,
              scoreGapFromBest: 20,
            },
            rank: 2,
            reasons: ["cornerGiven"],
            score: 80,
            square: 9,
          }),
        ],
        evaluationSource: "minimax",
      },
      {
        messageStyle: "direct",
      },
    );

    expect(hints[0]?.message).toBe(
      "B2 は注意。置いた後に、相手が角を取れる形になりやすい手です。",
    );
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

  it("uses a stable edge hint when a move extends from an owned corner", () => {
    const board = createBoardFixture({
      0: "black",
      2: "white",
      3: "black",
    });
    const hint = createCoachHint(board, "black", {
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "stableEdge",
        reasons: expect.arrayContaining(["stablePosition"]),
        square: 1,
      }),
    );
    expect(hint?.message).toContain("角からつながる辺");
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

  it("can use the strongest candidate as direct teacher guidance", () => {
    const board = createInitialBoard();
    const hint = createCoachHint(board, "black", {
      includeBestMoveHint: true,
      searchDepth: 1,
    });

    expect(hint).toEqual(
      expect.objectContaining({
        kind: "bestMove",
        square: expect.any(Number),
      }),
    );
    expect(hint?.message).toContain("本命");
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
