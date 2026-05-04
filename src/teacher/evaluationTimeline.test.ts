import { describe, expect, it } from "vitest";
import { strategicEvaluateBoard } from "../cpu";
import { createEmptyBoard, type Board } from "../game/othello";
import type { MoveRecord } from "../game/session";
import {
  createEvaluationTimeline,
  findTurningPointMoveNumbers,
} from "./evaluationTimeline";
import type { EvaluationTimelineEntry } from "./reviewTypes";

describe("evaluation timeline", () => {
  it("creates reviewed-disc score entries from move history", () => {
    const boardBefore = createBoardWithDiscs({ 0: "black", 10: "white" });
    const boardAfter = createBoardWithDiscs({
      0: "black",
      10: "white",
      11: "black",
    });

    const timeline = createEvaluationTimeline(
      [
        createMoveRecord({
          boardAfter,
          boardBefore,
          disc: "black",
          moveNumber: 7,
          square: 11,
        }),
      ],
      "black",
    );

    const scoreBefore = strategicEvaluateBoard(boardBefore, "black");
    const scoreAfter = strategicEvaluateBoard(boardAfter, "black");

    expect(timeline).toEqual([
      {
        delta: scoreAfter - scoreBefore,
        disc: "black",
        moveNumber: 7,
        scoreAfter,
        scoreBefore,
        square: 11,
      },
    ]);
  });

  it("finds reviewed-disc moves that drop and do not recover soon", () => {
    const timeline = [
      createTimelineEntry({
        delta: -45,
        disc: "black",
        moveNumber: 12,
        scoreAfter: 55,
        scoreBefore: 100,
      }),
      createTimelineEntry({
        delta: -5,
        disc: "white",
        moveNumber: 13,
        scoreAfter: 50,
        scoreBefore: 55,
      }),
      createTimelineEntry({
        delta: 4,
        disc: "black",
        moveNumber: 14,
        scoreAfter: 54,
        scoreBefore: 50,
      }),
    ];

    expect(findTurningPointMoveNumbers(timeline, "black")).toEqual([12]);
  });

  it("ignores small changes", () => {
    const timeline = [
      createTimelineEntry({
        delta: -20,
        disc: "black",
        moveNumber: 12,
        scoreAfter: 80,
        scoreBefore: 100,
      }),
    ];

    expect(findTurningPointMoveNumbers(timeline, "black")).toEqual([]);
  });

  it("ignores drops that recover within the lookahead window", () => {
    const timeline = [
      createTimelineEntry({
        delta: -50,
        disc: "black",
        moveNumber: 12,
        scoreAfter: 50,
        scoreBefore: 100,
      }),
      createTimelineEntry({
        delta: 42,
        disc: "white",
        moveNumber: 13,
        scoreAfter: 92,
        scoreBefore: 50,
      }),
    ];

    expect(findTurningPointMoveNumbers(timeline, "black")).toEqual([]);
  });

  it("does not choose opponent moves in the first version", () => {
    const timeline = [
      createTimelineEntry({
        delta: -50,
        disc: "white",
        moveNumber: 12,
        scoreAfter: 50,
        scoreBefore: 100,
      }),
    ];

    expect(findTurningPointMoveNumbers(timeline, "black")).toEqual([]);
  });
});

function createTimelineEntry({
  delta,
  disc,
  moveNumber,
  scoreAfter,
  scoreBefore,
}: Omit<EvaluationTimelineEntry, "square">): EvaluationTimelineEntry {
  return {
    delta,
    disc,
    moveNumber,
    scoreAfter,
    scoreBefore,
    square: 19,
  };
}

function createBoardWithDiscs(discs: Record<number, "black" | "white">): Board {
  const board = createEmptyBoard();

  for (const [index, disc] of Object.entries(discs)) {
    board[Number(index)] = disc;
  }

  return board;
}

function createMoveRecord({
  boardAfter,
  boardBefore,
  disc,
  moveNumber,
  square,
}: Pick<
  MoveRecord,
  "boardAfter" | "boardBefore" | "disc" | "moveNumber" | "square"
>): MoveRecord {
  return {
    boardAfter,
    boardBefore,
    disc,
    flippedSquares: [],
    legalMovesBefore: [square],
    moveNumber,
    square,
  };
}
