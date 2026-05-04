import { describe, expect, it } from "vitest";
import { createInitialBoard } from "../game/othello";
import type { PracticeSessionOptions } from "../game/session";
import { appFlowReducer, type AppFlowState } from "./useAppFlow";

describe("app flow reducer", () => {
  it("starts a match and clears screen-specific state", () => {
    const state: AppFlowState = {
      screen: "review",
      moveNumber: 12,
    };

    expect(appFlowReducer(state, { type: "START_MATCH" })).toEqual({
      screen: "game",
    });
  });

  it("opens review at the completed move number and updates the selected review move", () => {
    const reviewState = appFlowReducer(
      { screen: "game" },
      { type: "OPEN_REVIEW", moveNumber: 42 },
    );

    expect(reviewState).toEqual({
      screen: "review",
      moveNumber: 42,
    });
    expect(
      appFlowReducer(reviewState, {
        type: "SELECT_REVIEW_MOVE",
        moveNumber: 17,
      }),
    ).toEqual({
      screen: "review",
      moveNumber: 17,
    });
  });

  it("keeps the practice start options and returns to the selected review move", () => {
    const start = createPracticeOptions();
    const practiceState = appFlowReducer(
      {
        screen: "review",
        moveNumber: 8,
      },
      {
        type: "START_PRACTICE",
        returnMoveNumber: 8,
        start,
      },
    );

    expect(practiceState).toEqual({
      screen: "practice",
      returnMoveNumber: 8,
      start,
    });
    expect(appFlowReducer(practiceState, { type: "PRACTICE_PLAY_AGAIN" })).toBe(
      practiceState,
    );
    expect(appFlowReducer(practiceState, { type: "BACK_TO_REVIEW" })).toEqual({
      screen: "review",
      moveNumber: 8,
    });
  });

  it("keeps invalid practice-only transitions unchanged", () => {
    const gameState: AppFlowState = { screen: "game" };

    expect(appFlowReducer(gameState, { type: "BACK_TO_REVIEW" })).toBe(
      gameState,
    );
    expect(appFlowReducer(gameState, { type: "PRACTICE_PLAY_AGAIN" })).toBe(
      gameState,
    );
  });

  it("moves back to the expected app-level screens", () => {
    expect(
      appFlowReducer(
        { screen: "review", moveNumber: 4 },
        {
          type: "BACK_TO_RESULT",
        },
      ),
    ).toEqual({ screen: "game" });
    expect(appFlowReducer({ screen: "game" }, { type: "PLAY_AGAIN" })).toEqual({
      screen: "game",
    });
    expect(
      appFlowReducer({ screen: "game" }, { type: "BACK_TO_START" }),
    ).toEqual({
      screen: "start",
    });
  });
});

function createPracticeOptions(): PracticeSessionOptions {
  return {
    board: createInitialBoard(),
    lastMove: 19,
    nextDisc: "white",
  };
}
