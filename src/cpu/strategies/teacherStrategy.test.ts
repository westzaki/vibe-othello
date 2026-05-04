import { describe, expect, it } from "vitest";
import { createInitialBoard, getLegalMoves } from "../../game/othello";
import { createBoardFixture } from "../../test/boardFixtures";
import { chooseTeacherMove, getTeacherMoveScores } from "./teacherStrategy";

describe("teacher CPU strategy", () => {
  it("returns a legal move with the teacher search", () => {
    const board = createInitialBoard();
    const move = chooseTeacherMove(board, "black");

    expect(move).not.toBeNull();
    expect(getLegalMoves(board, "black")).toContain(move);
  });

  it("uses exact reading when ten or fewer squares remain", () => {
    const board = createBoardFixture({ 0: null, 7: "white" }, "black");

    expect(getTeacherMoveScores(board, "white")).toEqual([
      { move: 0, score: -48 },
    ]);
  });
});
