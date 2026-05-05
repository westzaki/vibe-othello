import { describe, expect, it } from "vitest";
import { getLegalMoves, getNextDisc, placeDisc } from "../game/othello";
import { createBoardFixture } from "../test/boardFixtures";
import {
  analyzeMoveCandidates,
  getMoveCandidateReasons,
} from "./analyzeMoveCandidates";

describe("teacher move candidate analysis", () => {
  it("marks and penalizes candidates that newly give the opponent a corner", () => {
    const board = createBoardFixture({
      10: "white",
      11: "black",
      18: "white",
      27: "white",
      28: "black",
    });
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const cornerGivingCandidate = analysis.candidateMoves.find(
      (candidate) => candidate.square === 9,
    );

    expect(analysis.evaluationSource).toBe("minimax");
    expect(cornerGivingCandidate?.reasons).toContain("cornerGiven");
    expect(cornerGivingCandidate?.metrics).toEqual(
      expect.objectContaining({
        givesOpponentCorner: true,
        isDangerSquare: true,
        scoreGapFromBest: expect.any(Number),
      }),
    );
    expect(analysis.candidateMoves[0].square).not.toBe(9);
  });

  it("uses exact endgame scores for endgame candidates", () => {
    const board = createBoardFixture(
      {
        0: null,
        1: null,
        2: null,
        16: "white",
      },
      "black",
    );
    const analysis = analyzeMoveCandidates(board, "white", {
      searchDepth: 1,
    });

    expect(analysis.evaluationSource).toBe("exactEndgame");
    expect(analysis.candidateMoves).toEqual([
      expect.objectContaining({
        rank: 1,
        score: -580,
        square: 0,
      }),
      expect.objectContaining({
        rank: 2,
        score: -620,
        square: 2,
      }),
    ]);
  });

  it("keeps candidate reasons based on each candidate board", () => {
    const board = createBoardFixture({
      10: "white",
      11: "black",
      18: "white",
      27: "white",
      28: "black",
    });
    const candidateBoard = placeDisc(board, 9, "black");
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const cornerGivingCandidate = analysis.candidateMoves.find(
      (candidate) => candidate.square === 9,
    );

    expect(candidateBoard[9]).toBe("black");
    expect(cornerGivingCandidate?.reasons).toEqual([
      "dangerSquare",
      "cornerGiven",
    ]);
  });

  it("can analyze reasons for a single reviewed move snapshot", () => {
    const boardBefore = createBoardFixture({
      1: "black",
    });
    const boardAfter = createBoardFixture({
      1: "black",
      2: "white",
    });

    expect(
      getMoveCandidateReasons({
        boardAfter,
        boardBefore,
        disc: "black",
        square: 9,
      }),
    ).toEqual(["dangerSquare", "cornerGiven"]);
  });

  it("marks candidates that improve current player mobility", () => {
    const board = createBoardFixture({
      18: "white",
      19: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    });
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const mobilityCandidate = analysis.candidateMoves.find(
      (candidate) => candidate.square === 26,
    );

    expect(mobilityCandidate?.reasons).toContain("mobilityGain");
    expect(mobilityCandidate?.metrics.mobilitySwing).toBeGreaterThanOrEqual(3);
  });

  it("marks candidates that extend an edge anchored by an owned corner", () => {
    const board = createBoardFixture({
      0: "black",
      2: "white",
      3: "black",
    });
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const anchoredEdgeCandidate = analysis.candidateMoves.find(
      (candidate) => candidate.square === 1,
    );

    expect(anchoredEdgeCandidate?.reasons).toContain("stablePosition");
    expect(anchoredEdgeCandidate?.metrics.anchoredEdgeDelta).toBeGreaterThan(0);
  });

  it("does not mark open-corner edge moves as anchored edges", () => {
    const board = createBoardFixture({
      2: "white",
      3: "black",
    });
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const edgeCandidate = analysis.candidateMoves.find(
      (candidate) => candidate.square === 1,
    );

    expect(edgeCandidate?.reasons).not.toContain("stablePosition");
    expect(edgeCandidate?.metrics.anchoredEdgeDelta).toBe(0);
  });

  it("marks candidates that reduce current player mobility", () => {
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
    const analysis = analyzeMoveCandidates(board, "white", {
      searchDepth: 1,
    });
    const mobilityCandidate = analysis.candidateMoves.find(
      (candidate) => candidate.square === 11,
    );

    expect(mobilityCandidate?.reasons).toContain("mobilityLoss");
    expect(mobilityCandidate?.metrics.mobilitySwing).toBeLessThanOrEqual(-3);
  });

  it("stores before and after mobility metrics for each candidate", () => {
    const board = createBoardFixture({
      18: "white",
      19: "black",
      27: "white",
      28: "black",
      35: "black",
      36: "white",
    });
    const analysis = analyzeMoveCandidates(board, "black", {
      searchDepth: 1,
    });
    const bestCandidate = analysis.candidateMoves[0];
    const boardAfter = placeDisc(board, bestCandidate.square, "black");
    const opponentDisc = getNextDisc("black");
    const playerMobilityBefore = getLegalMoves(board, "black").length;
    const playerMobilityAfter = getLegalMoves(boardAfter, "black").length;
    const opponentMobilityBefore = getLegalMoves(board, opponentDisc).length;
    const opponentMobilityAfter = getLegalMoves(
      boardAfter,
      opponentDisc,
    ).length;

    expect(bestCandidate.metrics).toEqual({
      anchoredEdgeDelta: 0,
      anchoredEdgeDifferenceAfter: 0,
      anchoredEdgeDifferenceBefore: 0,
      givesOpponentCorner: false,
      isCorner: false,
      isDangerSquare: false,
      mobilityDifferenceAfter: playerMobilityAfter - opponentMobilityAfter,
      mobilityDifferenceBefore: playerMobilityBefore - opponentMobilityBefore,
      mobilitySwing:
        playerMobilityAfter -
        opponentMobilityAfter -
        (playerMobilityBefore - opponentMobilityBefore),
      opponentMobilityAfter,
      opponentMobilityBefore,
      opponentMobilityDelta: opponentMobilityAfter - opponentMobilityBefore,
      playerMobilityAfter,
      playerMobilityBefore,
      playerMobilityDelta: playerMobilityAfter - playerMobilityBefore,
      scoreGapFromBest: 0,
    });
  });
});
