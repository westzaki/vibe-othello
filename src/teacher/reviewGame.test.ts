import { describe, expect, it } from "vitest";
import { createEmptyBoard, type Board } from "../game/othello";
import type { MoveRecord } from "../game/session";
import { placeCurrentDisc, startNewGame } from "../game/session";
import { reviewGame } from "./reviewGame";

describe("teacher review", () => {
  it("reviews only the requested disc", () => {
    const afterBlack = placeCurrentDisc(startNewGame(), 19).session;
    const afterWhite = placeCurrentDisc(afterBlack, 18).session;

    const review = reviewGame(afterWhite.moveHistory, {
      reviewedDisc: "black",
      searchDepth: 1,
    });

    expect(review.reviewedDisc).toBe("black");
    expect(review.reviewedMoves).toHaveLength(1);
    expect(review.reviewedMoves[0].moveNumber).toBe(1);
    expect(review.reviewedMoves[0].review.disc).toBe("black");
    expect(review.reviewedMoves[0].candidateMoves.length).toBeGreaterThan(0);
  });

  it("keeps structured candidate scores for later move-by-move analysis", () => {
    const session = placeCurrentDisc(startNewGame(), 19).session;
    const review = reviewGame(session.moveHistory, {
      reviewedDisc: "black",
      searchDepth: 1,
    });
    const reviewedMove = review.reviewedMoves[0];

    expect(reviewedMove.candidateMoves[0]).toEqual(
      expect.objectContaining({
        rank: 1,
        score: expect.any(Number),
        square: expect.any(Number),
      }),
    );
    expect(reviewedMove.review.reasons.length).toBeGreaterThan(0);
    expect(review).not.toHaveProperty("advice");
  });

  it("does not blame a move for a corner the opponent already had", () => {
    const boardBefore = createCornerThreatBoard();
    const boardAfter = [...boardBefore];
    boardAfter[10] = "black";
    const review = reviewGame(
      [createMoveRecord({ boardAfter, boardBefore, square: 10 })],
      {
        reviewedDisc: "black",
        searchDepth: 1,
      },
    );

    expect(review.reviewedMoves[0].review.reasons).not.toContain("cornerGiven");
  });

  it("marks cornerGiven when the move creates a new opponent corner", () => {
    const boardBefore = createEmptyBoard();
    boardBefore[1] = "black";
    const boardAfter = createCornerThreatBoard();
    const review = reviewGame(
      [createMoveRecord({ boardAfter, boardBefore, square: 10 })],
      {
        reviewedDisc: "black",
        searchDepth: 1,
      },
    );

    expect(review.reviewedMoves[0].review.reasons).toContain("cornerGiven");
  });

  it("adds turningPoint when the reviewed move drops and does not recover soon", () => {
    const boardBefore = createEmptyBoard();
    boardBefore[0] = "black";
    const boardAfter = createEmptyBoard();
    boardAfter[0] = "white";
    boardAfter[10] = "black";
    const review = reviewGame(
      [
        createMoveRecord({
          boardAfter,
          boardBefore,
          moveNumber: 12,
          square: 10,
        }),
      ],
      {
        reviewedDisc: "black",
        searchDepth: 1,
      },
    );

    expect(review.reviewedMoves[0].review.reasons).toContain("turningPoint");
    expect(review.reviewedMoves[0].review.kind).toBe("bad");
  });

  it("does not add turningPoint for small evaluation changes", () => {
    const boardBefore = createEmptyBoard();
    const boardAfter = createEmptyBoard();
    boardAfter[27] = "black";
    const review = reviewGame(
      [
        createMoveRecord({
          boardAfter,
          boardBefore,
          moveNumber: 12,
          square: 27,
        }),
      ],
      {
        reviewedDisc: "black",
        searchDepth: 1,
      },
    );

    expect(review.reviewedMoves[0].review.reasons).not.toContain(
      "turningPoint",
    );
  });

  it("keeps corner and danger reasons when turningPoint is added", () => {
    const boardBefore = createEmptyBoard();
    boardBefore[7] = "black";
    const boardAfter = createEmptyBoard();
    boardAfter[7] = "white";
    boardAfter[9] = "black";
    const review = reviewGame(
      [
        createMoveRecord({
          boardAfter,
          boardBefore,
          moveNumber: 12,
          square: 9,
        }),
      ],
      {
        reviewedDisc: "black",
        searchDepth: 1,
      },
    );

    expect(review.reviewedMoves[0].review.reasons).toEqual(
      expect.arrayContaining(["dangerSquare", "turningPoint"]),
    );
  });
});

function createCornerThreatBoard(): Board {
  const board = createEmptyBoard();
  board[1] = "black";
  board[2] = "white";

  return board;
}

function createMoveRecord({
  boardAfter,
  boardBefore,
  moveNumber = 1,
  square,
}: {
  boardAfter: Board;
  boardBefore: Board;
  moveNumber?: number;
  square: number;
}): MoveRecord {
  return {
    boardAfter,
    boardBefore,
    disc: "black",
    flippedSquares: [],
    legalMovesBefore: [square],
    moveNumber,
    square,
  };
}
