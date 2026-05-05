import { describe, expect, it } from "vitest";
import { createInitialBoard, placeDisc } from "../game/othello";
import { createPlayPositionAnalysis } from "../teacher";
import {
  createPlayPositionAnalysisKey,
  createPlayPositionAnalysisState,
  getCurrentPlayPositionAnalysis,
} from "./playPositionAnalysisState";

describe("play position analysis state", () => {
  it("creates stable keys from the board, disc, and options", () => {
    const board = createInitialBoard();

    expect(
      createPlayPositionAnalysisKey({
        board,
        currentDisc: "black",
        options: { includeCandidateFallback: true, messageStyle: "specific" },
      }),
    ).toBe(
      createPlayPositionAnalysisKey({
        board,
        currentDisc: "black",
        options: { includeCandidateFallback: true, messageStyle: "specific" },
      }),
    );
    expect(
      createPlayPositionAnalysisKey({
        board,
        currentDisc: "white",
        options: { includeCandidateFallback: true, messageStyle: "specific" },
      }),
    ).not.toBe(
      createPlayPositionAnalysisKey({
        board,
        currentDisc: "black",
        options: { includeCandidateFallback: true, messageStyle: "specific" },
      }),
    );
  });

  it("returns the stored analysis when sources still match", () => {
    const board = createInitialBoard();
    const analysis = createPlayPositionAnalysis(board, "black");
    const state = createPlayPositionAnalysisState(
      { board, currentDisc: "black" },
      analysis,
    );

    expect(
      getCurrentPlayPositionAnalysis(state, { board, currentDisc: "black" }),
    ).toBe(analysis);
  });

  it("falls back to a fresh sync analysis when stored sources are stale", () => {
    const board = createInitialBoard();
    const nextBoard = placeDisc(board, 19, "black");
    const state = createPlayPositionAnalysisState({
      board,
      currentDisc: "black",
    });

    expect(
      getCurrentPlayPositionAnalysis(state, {
        board: nextBoard,
        currentDisc: "white",
      }),
    ).toEqual(createPlayPositionAnalysis(nextBoard, "white"));
  });
});
