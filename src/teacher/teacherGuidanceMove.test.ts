import { describe, expect, it } from "vitest";
import { createInitialBoard, getLegalMoves } from "../game/othello";
import { createBoardFixture } from "../test/boardFixtures";
import { analyzeMoveCandidates } from "./analyzeMoveCandidates";
import type { CandidateMoveReview } from "./reviewTypes";
import {
  chooseTeacherGuidanceMove,
  createTeacherSearchContext,
  evaluateTeacherSearchPosition,
  getTeacherDeepSearchDepth,
  orderTeacherSearchMoves,
  rankTeacherGuidanceCandidates,
  selectTeacherGuidanceCandidate,
  selectTeacherDeepeningCandidates,
  selectStrongTeacherCandidates,
  selectTeacherGuidanceSelection,
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

  it("keeps teacher recommendations inside a strong score band", () => {
    const candidates = [
      createCandidateMove({ rank: 1, score: 100, square: 19 }),
      createCandidateMove({
        metrics: {
          anchoredEdgeDelta: 1,
          isCorner: true,
          mobilitySwing: 6,
        },
        rank: 2,
        score: 69,
        square: 26,
      }),
      createCandidateMove({ rank: 3, score: 75, square: 37 }),
    ];

    expect(selectStrongTeacherCandidates(candidates, 30)).toEqual([
      candidates[0],
      candidates[2],
    ]);
  });

  it("does not let learning themes widen the recommendation score band", () => {
    const board = createInitialBoard();
    const strongCandidate = createCandidateMove({
      rank: 1,
      score: 100,
      square: 19,
    });
    const weakLearningCandidate = createCandidateMove({
      metrics: {
        anchoredEdgeDelta: 1,
        isCorner: true,
        mobilitySwing: 6,
      },
      rank: 2,
      score: 60,
      square: 26,
    });

    expect(
      rankTeacherGuidanceCandidates({
        board,
        candidates: [strongCandidate, weakLearningCandidate],
        disc: "black",
        refutationSearchDepth: 1,
      }).map(({ candidate }) => candidate),
    ).toEqual([strongCandidate]);
  });

  it("keeps comeback recommendations inside the strong score band", () => {
    const board = createInitialBoard();
    const strongCandidate = createCandidateMove({
      metrics: { opponentMobilityAfter: 5 },
      rank: 1,
      score: 100,
      square: 19,
    });
    const weakPressureCandidate = createCandidateMove({
      metrics: {
        mobilitySwing: 6,
        opponentMobilityAfter: 1,
        opponentMobilityDelta: -4,
      },
      rank: 2,
      score: 60,
      square: 26,
    });

    expect(
      rankTeacherGuidanceCandidates({
        board,
        candidates: [strongCandidate, weakPressureCandidate],
        disc: "black",
        guidanceMode: "comeback",
        refutationSearchDepth: 1,
      }).map(({ candidate }) => candidate),
    ).toEqual([strongCandidate]);
  });

  it("prioritizes opponent mobility pressure in comeback mode when search scores are close", () => {
    const board = createInitialBoard();
    const searchBestCandidate = createCandidateMove({
      metrics: {
        mobilitySwing: 0,
        opponentMobilityAfter: 6,
        opponentMobilityDelta: 1,
      },
      rank: 1,
      score: 100,
      square: 19,
    });
    const pressureCandidate = createCandidateMove({
      metrics: {
        mobilitySwing: 5,
        opponentMobilityAfter: 1,
        opponentMobilityDelta: -4,
      },
      rank: 2,
      score: 96,
      square: 26,
    });

    const rankedCandidates = rankTeacherGuidanceCandidates({
      board,
      candidates: [searchBestCandidate, pressureCandidate],
      disc: "black",
      guidanceMode: "comeback",
      refutationSearchDepth: 1,
    });

    expect(rankedCandidates[0]?.candidate).toBe(pressureCandidate);
    expect(rankedCandidates[0]?.opponentPressureScore).toBeGreaterThan(
      rankedCandidates[1]?.opponentPressureScore ?? 0,
    );
  });

  it("keeps normal mode close to search-score priority", () => {
    const board = createInitialBoard();
    const searchBestCandidate = createCandidateMove({
      metrics: {
        mobilitySwing: 0,
        opponentMobilityAfter: 6,
        opponentMobilityDelta: 1,
      },
      rank: 1,
      score: 100,
      square: 19,
    });
    const pressureCandidate = createCandidateMove({
      metrics: {
        mobilitySwing: 5,
        opponentMobilityAfter: 1,
        opponentMobilityDelta: -4,
      },
      rank: 2,
      score: 96,
      square: 26,
    });

    expect(
      rankTeacherGuidanceCandidates({
        board,
        candidates: [searchBestCandidate, pressureCandidate],
        disc: "black",
        guidanceMode: "normal",
        refutationSearchDepth: 1,
      })[0]?.candidate,
    ).toBe(searchBestCandidate);
  });

  it("penalizes opponent corner access in normal and comeback ranking", () => {
    const board = createBoardFixture({});
    const cornerAccessCandidate = createCandidateMove({
      metrics: {
        givesOpponentCorner: true,
        mobilitySwing: 6,
        opponentCornerMoveDelta: 1,
        opponentCornerMovesAfter: 1,
        opponentMobilityAfter: 1,
        opponentMobilityDelta: -4,
      },
      rank: 1,
      score: 100,
      square: 19,
    });
    const saferCandidate = createCandidateMove({
      metrics: {
        opponentCornerMoveDelta: 0,
        opponentCornerMovesAfter: 0,
        opponentMobilityAfter: 5,
        opponentMobilityDelta: 0,
      },
      rank: 2,
      score: 96,
      square: 26,
    });

    for (const guidanceMode of ["normal", "comeback"] as const) {
      const rankedCandidates = rankTeacherGuidanceCandidates({
        board,
        candidates: [cornerAccessCandidate, saferCandidate],
        disc: "black",
        guidanceMode,
        refutationSearchDepth: 1,
      });

      expect(rankedCandidates[0]?.candidate).toBe(saferCandidate);
      expect(rankedCandidates[1]?.opponentCornerAccessPenalty).toBeGreaterThan(
        0,
      );
    }
  });

  it("avoids high refutation risk in comeback mode even with opponent pressure", () => {
    const board = createBoardFixture({
      10: "white",
      11: "black",
      18: "white",
      27: "white",
      28: "black",
    });
    const refutedPressureCandidate = createCandidateMove({
      metrics: {
        givesOpponentCorner: true,
        isDangerSquare: true,
        mobilitySwing: 6,
        opponentMobilityAfter: 1,
        opponentMobilityDelta: -4,
      },
      rank: 1,
      score: 200,
      square: 9,
    });
    const saferCandidate = createCandidateMove({
      metrics: {
        mobilitySwing: 0,
        opponentMobilityAfter: 5,
        opponentMobilityDelta: 0,
      },
      rank: 2,
      score: 196,
      square: 26,
    });

    const rankedCandidates = rankTeacherGuidanceCandidates({
      board,
      candidates: [refutedPressureCandidate, saferCandidate],
      disc: "black",
      guidanceMode: "comeback",
      refutationSearchDepth: 1,
    });

    expect(rankedCandidates[0]?.candidate).toBe(saferCandidate);
    expect(rankedCandidates[1]?.refutationPenalty).toBeGreaterThan(0);
  });

  it("switches auto mode to comeback only when the position is disadvantaged", () => {
    const board = createInitialBoard();
    const searchBestCandidate = createCandidateMove({
      metrics: {
        opponentMobilityAfter: 6,
        opponentMobilityDelta: 1,
      },
      rank: 1,
      score: 100,
      square: 19,
    });
    const pressureCandidate = createCandidateMove({
      metrics: {
        mobilitySwing: 5,
        opponentMobilityAfter: 1,
        opponentMobilityDelta: -4,
      },
      rank: 2,
      score: 96,
      square: 26,
    });
    const candidates = [searchBestCandidate, pressureCandidate];

    expect(
      rankTeacherGuidanceCandidates({
        board,
        candidates,
        disc: "black",
        guidanceMode: "auto",
        isDisadvantaged: true,
        refutationSearchDepth: 1,
      })[0]?.candidate,
    ).toBe(pressureCandidate);
    expect(
      rankTeacherGuidanceCandidates({
        board,
        candidates,
        disc: "black",
        guidanceMode: "auto",
        isDisadvantaged: false,
        refutationSearchDepth: 1,
      })[0]?.candidate,
    ).toBe(searchBestCandidate);
  });

  it("records a refutation penalty for a risky candidate when no safer strong candidate exists", () => {
    const board = createInitialBoard();
    const cornerGivingCandidate = createCandidateMove({
      metrics: { givesOpponentCorner: true },
      rank: 1,
      score: 100,
      square: 19,
    });

    const rankedCandidates = rankTeacherGuidanceCandidates({
      board,
      candidates: [cornerGivingCandidate],
      disc: "black",
      refutationSearchDepth: 1,
    });

    expect(rankedCandidates[0]).toEqual(
      expect.objectContaining({
        candidate: cornerGivingCandidate,
        refutation: expect.objectContaining({
          opponentSquare: expect.any(Number),
          severity: expect.stringMatching(/^(medium|high)$/),
        }),
        refutationPenalty: expect.any(Number),
      }),
    );
    expect(rankedCandidates[0]?.refutationPenalty).toBeGreaterThan(0);
  });

  it("returns a legal teacher guidance move", () => {
    expect(
      chooseTeacherGuidanceMove(createInitialBoard(), "black", {
        deepSearchDepth: 3,
        shallowSearchDepth: 1,
      }),
    ).toEqual(expect.any(Number));
  });

  it("keeps teacher search cache request-local and reuses exact scores", () => {
    const board = createInitialBoard();
    const searchContext = createTeacherSearchContext();
    const firstScore = evaluateTeacherSearchPosition({
      board,
      currentDisc: "black",
      depth: 1,
      maximizingDisc: "black",
      searchContext,
    });
    const searchedNodeCountAfterFirstRun = searchContext.searchedNodeCount;

    const secondScore = evaluateTeacherSearchPosition({
      board,
      currentDisc: "black",
      depth: 1,
      maximizingDisc: "black",
      searchContext,
    });

    expect(secondScore).toBe(firstScore);
    expect(searchContext.cacheHitCount).toBeGreaterThan(0);
    expect(searchContext.searchedNodeCount).toBe(
      searchedNodeCountAfterFirstRun,
    );

    const separateContext = createTeacherSearchContext();

    evaluateTeacherSearchPosition({
      board,
      currentDisc: "black",
      depth: 1,
      maximizingDisc: "black",
      searchContext: separateContext,
    });

    expect(separateContext.cacheHitCount).toBe(0);
  });

  it("orders teacher search moves with corners before ordinary moves", () => {
    const board = createBoardFixture({
      1: "white",
      2: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    });
    const orderedMoves = orderTeacherSearchMoves({
      board,
      currentDisc: "black",
      isMaximizing: true,
      legalMoves: getLegalMoves(board, "black"),
      maximizingDisc: "black",
    });

    expect(orderedMoves[0]).toBe(0);
  });

  it("orders corner-giving danger squares behind safer teacher search moves", () => {
    const board = createBoardFixture({
      10: "white",
      11: "black",
      18: "white",
      27: "white",
      28: "black",
    });
    const orderedMoves = orderTeacherSearchMoves({
      board,
      currentDisc: "black",
      isMaximizing: true,
      legalMoves: getLegalMoves(board, "black"),
      maximizingDisc: "black",
    });

    expect(orderedMoves.indexOf(9)).toBeGreaterThan(orderedMoves.indexOf(26));
  });

  it("keeps adaptive depth preparation neutral for now", () => {
    expect(
      getTeacherDeepSearchDepth({
        baseDepth: 6,
        candidates: [
          createCandidateMove({ rank: 1, score: 100, square: 19 }),
          createCandidateMove({ rank: 2, score: 96, square: 26 }),
        ],
        emptyCount: 28,
        guidanceMode: "comeback",
      }),
    ).toBe(6);
  });

  it("can return the selected guidance candidate for shared play and review use", () => {
    const board = createInitialBoard();
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const candidate = selectTeacherGuidanceCandidate({
      analysis,
      board,
      deepSearchDepth: 3,
      disc: "black",
    });

    expect(candidate).toEqual(
      expect.objectContaining({
        square: chooseTeacherGuidanceMove(board, "black", {
          deepSearchDepth: 3,
          shallowSearchDepth: 1,
        }),
      }),
    );
  });

  it("can return selected guidance details for play hint explanations", () => {
    const board = createInitialBoard();
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const selection = selectTeacherGuidanceSelection({
      analysis,
      board,
      deepSearchDepth: 3,
      disc: "black",
      guidanceMode: "comeback",
    });

    expect(selection).toEqual(
      expect.objectContaining({
        candidate: expect.objectContaining({
          square: expect.any(Number),
        }),
        guidance: expect.objectContaining({
          opponentPressureScore: expect.any(Number),
          refutationPenalty: expect.any(Number),
          scoreGapFromBest: expect.any(Number),
        }),
      }),
    );
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
      opponentCornerMoveDelta: 0,
      opponentCornerMovesAfter: 0,
      opponentCornerMovesBefore: 0,
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
