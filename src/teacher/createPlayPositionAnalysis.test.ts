import { describe, expect, it } from "vitest";
import { calculateAdvantage } from "../cpu";
import { createInitialBoard } from "../game/othello";
import { createBoardFixture } from "../test/boardFixtures";
import { createPlayPositionAnalysis } from "./createPlayPositionAnalysis";

describe("createPlayPositionAnalysis", () => {
  it("summarizes the opening position with search candidates", () => {
    const analysis = createPlayPositionAnalysis(createInitialBoard(), "black", {
      searchDepth: 1,
    });

    expect(analysis).toEqual(
      expect.objectContaining({
        advantageSource: "searchAdjusted",
        confidence: "medium",
        confidenceReason: "searchCandidates",
        currentDisc: "black",
        emptyCount: 60,
        moveEvaluationSource: "search",
        phase: "opening",
      }),
    );
    expect(analysis.legalMoves).toHaveLength(4);
    expect(analysis.candidateMoves).toHaveLength(4);
    expect(analysis.coachHints).toEqual([
      expect.objectContaining({
        kind: "candidate",
        square: expect.any(Number),
      }),
    ]);
    expect(analysis.shapeSignals).toEqual([]);
  });

  it("can prepare direct teacher guidance from the strongest candidate", () => {
    const analysis = createPlayPositionAnalysis(createInitialBoard(), "black", {
      includeBestMoveHint: true,
      searchDepth: 1,
      useSelectiveDeepening: true,
    });

    expect(analysis.coachHints[0]).toEqual(
      expect.objectContaining({
        kind: "bestMove",
        square: analysis.candidateMoves[0].square,
      }),
    );
  });

  it("adjusts the play advantage with the best candidate search outlook", () => {
    const board = createBoardFixture({
      1: "white",
      2: "black",
      10: "white",
      11: "black",
    });
    const baseAdvantage = calculateAdvantage(board, "black");
    const analysis = createPlayPositionAnalysis(board, "black", {
      searchDepth: 1,
    });

    expect(analysis.advantageSource).toBe("searchAdjusted");
    expect(analysis.candidateMoves[0]).toEqual(
      expect.objectContaining({
        metrics: expect.objectContaining({
          isCorner: true,
        }),
        square: 0,
      }),
    );
    expect(analysis.advantage.blackPercent).toBeGreaterThan(
      baseAdvantage.blackPercent,
    );
    expect(analysis.advantage.leadingDisc).toBe("black");
  });

  it("keeps risk and helpful candidates in the same analysis", () => {
    const analysis = createPlayPositionAnalysis(
      createBoardFixture({
        1: "white",
        2: "black",
        10: "white",
        11: "black",
      }),
      "black",
      { searchDepth: 1 },
    );

    expect(analysis.riskCandidates).toEqual([
      expect.objectContaining({
        reasons: expect.arrayContaining(["dangerSquare"]),
        square: 9,
      }),
    ]);
    expect(analysis.helpfulCandidates).toEqual([
      expect.objectContaining({
        reasons: expect.arrayContaining(["corner"]),
        square: 0,
      }),
    ]);
    expect(analysis.coachHints).toEqual([
      expect.objectContaining({
        kind: "mobilityRisk",
        square: 9,
      }),
      expect.objectContaining({
        kind: "cornerOpportunity",
        square: 0,
      }),
    ]);
    expect(analysis.shapeSignals).toEqual([
      expect.objectContaining({
        kind: "cornerOpportunity",
        square: 0,
        strength: "high",
        tone: "helpful",
      }),
      expect.objectContaining({
        kind: "mobilityRisk",
        square: 9,
        tone: "risk",
      }),
    ]);
  });

  it("uses exact endgame confidence for late positions", () => {
    const board = createBoardFromString(
      "wwwwb-b-wbbwbbwwwbwbbbbbwwwbbwbww-bwwbww-wwwbwb-bwwbbbw-ww-w--ww",
    );
    const baseAdvantage = calculateAdvantage(board, "white");
    const analysis = createPlayPositionAnalysis(board, "white", {
      searchDepth: 1,
    });

    expect(analysis).toEqual(
      expect.objectContaining({
        advantageSource: "exactEndgame",
        confidence: "high",
        confidenceReason: "exactEndgame",
        moveEvaluationSource: "exactEndgame",
        phase: "endgame",
      }),
    );
    expect(analysis.advantage).toEqual(baseAdvantage);
    expect(analysis.helpfulCandidates[0]).toEqual(
      expect.objectContaining({
        rank: 1,
      }),
    );
    expect(analysis.coachHints[0]).toEqual(
      expect.objectContaining({
        kind: "endgame",
      }),
    );
    expect(analysis.shapeSignals).toEqual([
      expect.objectContaining({
        kind: "endgame",
        square: expect.any(Number),
        strength: "high",
        tone: "neutral",
      }),
    ]);
  });

  it("returns no move candidates when the current player cannot move", () => {
    const analysis = createPlayPositionAnalysis(
      createBoardFixture({}, "black"),
      "white",
      { searchDepth: 1 },
    );

    expect(analysis).toEqual(
      expect.objectContaining({
        advantageSource: "final",
        candidateMoves: [],
        coachHints: [],
        confidence: "high",
        confidenceReason: "finalBoard",
        legalMoves: [],
        moveEvaluationSource: "none",
        shapeSignals: [],
      }),
    );
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
