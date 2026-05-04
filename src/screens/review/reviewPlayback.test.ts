import { describe, expect, it } from "vitest";
import { createDebugSession } from "../../debug/debugFixtures";
import { createEmptyBoard, type SquareIndex } from "../../game/othello";
import { startPracticeSession, type MoveRecord } from "../../game/session";
import type { ReviewedMove } from "../../teacher";
import {
  createPlaybackBoards,
  createPracticeOptionsFromMoveNumber,
  createReviewPlaybackDisplay,
  getNextDiscForMoveNumber,
} from "./reviewPlayback";

describe("review playback practice boundary", () => {
  it("starts practice from the board before the selected reviewed move without mutating the completed match", () => {
    const completedMatch = createDebugSession("blackWin");
    const originalMatchBoard = [...completedMatch.board];
    const originalMoveSnapshots = snapshotMoveHistory(completedMatch.moveHistory);
    const playbackBoards = createPlaybackBoards(completedMatch.moveHistory);
    const selectedMoveNumber = 12;
    const expectedPracticeMoveNumber = selectedMoveNumber - 1;
    const expectedPracticeBoard = playbackBoards[expectedPracticeMoveNumber];
    const selectedMove = completedMatch.moveHistory[selectedMoveNumber - 1];

    expect(completedMatch.status).toBe("ended");
    expect(completedMatch.endReason).toBe("completed");
    expect(expectedPracticeBoard).toEqual(selectedMove.boardBefore);

    const practiceOptions = createPracticeOptionsFromMoveNumber(
      completedMatch.moveHistory,
      playbackBoards,
      selectedMoveNumber,
    );
    const practiceSession = startPracticeSession(practiceOptions);

    expect(practiceOptions.board).toEqual(expectedPracticeBoard);
    expect(practiceOptions.lastMove).toBe(
      completedMatch.moveHistory[expectedPracticeMoveNumber - 1]?.square,
    );
    expect(practiceOptions.nextDisc).toBe(
      getNextDiscForMoveNumber(
        completedMatch.moveHistory,
        expectedPracticeMoveNumber,
      ),
    );
    expect(practiceSession.board).toEqual(expectedPracticeBoard);
    expect(practiceSession.board).not.toBe(expectedPracticeBoard);
    expect(practiceSession.board).not.toBe(practiceOptions.board);
    expect(practiceSession.moveHistory).toEqual([]);

    practiceSession.board[0] = "black";

    expect(completedMatch.board).toEqual(originalMatchBoard);
    expect(completedMatch.moveHistory).toHaveLength(
      originalMoveSnapshots.length,
    );
    expect(snapshotMoveHistory(completedMatch.moveHistory)).toEqual(
      originalMoveSnapshots,
    );
    expect(expectedPracticeBoard).toEqual(
      originalMoveSnapshots[expectedPracticeMoveNumber - 1].boardAfter,
    );
  });

  it("shows the board before a selected reviewed move with review markers", () => {
    const reviewedMove = createReviewedMove({
      bestSquare: 58,
      legalMovesBefore: [48, 58],
      square: 48,
    });
    const playbackBoards = createPlaybackBoards([reviewedMove]);

    const display = createReviewPlaybackDisplay(
      [reviewedMove],
      playbackBoards,
      reviewedMove.moveNumber,
      reviewedMove,
    );

    expect(display.mode).toBe("reviewTarget");
    expect(display.board).toBe(reviewedMove.boardBefore);
    expect(display.currentMove).toBe(reviewedMove);
    expect(display.positionReview).toEqual({
      bestSquare: 58,
      disc: "black",
      legalMoves: [48, 58],
    });
  });

  it("keeps review target display safe when there is no best square", () => {
    const reviewedMove = createReviewedMove({
      bestSquare: null,
      legalMovesBefore: [48],
      square: 48,
    });
    const playbackBoards = createPlaybackBoards([reviewedMove]);
    const display = createReviewPlaybackDisplay(
      [reviewedMove],
      playbackBoards,
      reviewedMove.moveNumber,
      reviewedMove,
    );

    expect(display.mode).toBe("reviewTarget");
    expect(display.positionReview.bestSquare).toBeNull();
    expect(display.positionReview.legalMoves).toEqual([48]);
  });

  it("keeps practice start aligned with the reviewed boardBefore", () => {
    const reviewedMove = createReviewedMove({
      bestSquare: 58,
      legalMovesBefore: [48, 58],
      square: 48,
    });
    const playbackBoards = createPlaybackBoards([reviewedMove]);
    const display = createReviewPlaybackDisplay(
      [reviewedMove],
      playbackBoards,
      reviewedMove.moveNumber,
      reviewedMove,
    );
    const practiceOptions = createPracticeOptionsFromMoveNumber(
      [reviewedMove],
      playbackBoards,
      reviewedMove.moveNumber,
    );

    expect(practiceOptions.board).toBe(display.board);
    expect(practiceOptions.board).toBe(reviewedMove.boardBefore);
  });
});

function snapshotMoveHistory(moveHistory: MoveRecord[]): MoveRecord[] {
  return moveHistory.map((move) => ({
    ...move,
    boardAfter: [...move.boardAfter],
    boardBefore: [...move.boardBefore],
    flippedSquares: [...move.flippedSquares],
    legalMovesBefore: [...move.legalMovesBefore],
  }));
}

function createReviewedMove({
  bestSquare,
  legalMovesBefore,
  square,
}: {
  bestSquare: SquareIndex | null;
  legalMovesBefore: SquareIndex[];
  square: SquareIndex;
}): ReviewedMove {
  const boardBefore = createEmptyBoard();
  const boardAfter = [...boardBefore];
  boardAfter[square] = "black";

  return {
    boardAfter,
    boardBefore,
    candidateMoves:
      bestSquare === null
        ? []
        : [
            {
              rank: 1,
              reasons: [],
              score: 10,
              square: bestSquare,
            },
          ],
    disc: "black",
    flippedSquares: [],
    legalMovesBefore,
    moveNumber: 1,
    review: {
      bestScore: bestSquare === null ? null : 10,
      bestSquare,
      disc: "black",
      kind: "bad",
      moveNumber: 1,
      playedScore: 0,
      reasons: ["scoreDrop"],
      scoreAfter: 0,
      scoreBefore: 0,
      square,
    },
    square,
  };
}
