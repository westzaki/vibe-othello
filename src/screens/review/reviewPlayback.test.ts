import { describe, expect, it } from "vitest";
import { createDebugSession } from "../../debug/debugFixtures";
import { startPracticeSession, type MoveRecord } from "../../game/session";
import {
  createPlaybackBoards,
  createPracticeOptionsFromMoveNumber,
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
