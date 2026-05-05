import { describe, expect, it } from "vitest";
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
        advantageSource: "heuristic",
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
    const analysis = createPlayPositionAnalysis(
      createBoardFromString(
        "wwwwb-b-wbbwbbwwwbwbbbbbwwwbbwbww-bwwbww-wwwbwb-bwwbbbw-ww-w--ww",
      ),
      "white",
      { searchDepth: 1 },
    );

    expect(analysis).toEqual(
      expect.objectContaining({
        advantageSource: "exactEndgame",
        confidence: "high",
        confidenceReason: "exactEndgame",
        moveEvaluationSource: "exactEndgame",
        phase: "endgame",
      }),
    );
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
