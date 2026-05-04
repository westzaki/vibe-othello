import { useReducer } from "react";
import type { CpuLevel } from "../cpu";
import type { DiscColor } from "../game/othello";
import { createMatchPlayerSettings, type GameMode } from "../game/matchSetup";
import type { PlayerSettings } from "../game/players";
import type { MoveRecord, PracticeSessionOptions } from "../game/session";
import {
  createPracticeFeedback,
  type PracticeFeedback,
  type PracticeFeedbackContext,
} from "../teacher";
import { useOthelloGame, type OthelloGameController } from "./useOthelloGame";

export type AppFlowState =
  | { screen: "start" }
  | { screen: "settings" }
  | { screen: "game" }
  | { screen: "review"; moveNumber: number }
  | {
      screen: "practice";
      feedbackContext: PracticeFeedbackContext | null;
      returnMoveNumber: number;
      start: PracticeSessionOptions;
    };

export type AppScreen = AppFlowState["screen"];

export type AppFlowAction =
  | { type: "OPEN_SETTINGS" }
  | { type: "START_MATCH" }
  | { type: "PLAY_AGAIN" }
  | { type: "BACK_TO_START" }
  | { type: "OPEN_REVIEW"; moveNumber: number }
  | { type: "BACK_TO_RESULT" }
  | { type: "SELECT_REVIEW_MOVE"; moveNumber: number }
  | {
      type: "START_PRACTICE";
      feedbackContext?: PracticeFeedbackContext | null;
      returnMoveNumber: number;
      start: PracticeSessionOptions;
    }
  | { type: "PRACTICE_PLAY_AGAIN" }
  | { type: "BACK_TO_REVIEW" };

const initialAppFlowState: AppFlowState = { screen: "start" };

export function appFlowReducer(
  state: AppFlowState,
  action: AppFlowAction,
): AppFlowState {
  switch (action.type) {
    case "OPEN_SETTINGS":
      return { screen: "settings" };
    case "START_MATCH":
    case "PLAY_AGAIN":
    case "BACK_TO_RESULT":
      return { screen: "game" };
    case "BACK_TO_START":
      return { screen: "start" };
    case "OPEN_REVIEW":
    case "SELECT_REVIEW_MOVE":
      return { screen: "review", moveNumber: action.moveNumber };
    case "START_PRACTICE":
      return {
        screen: "practice",
        feedbackContext: action.feedbackContext ?? null,
        returnMoveNumber: action.returnMoveNumber,
        start: action.start,
      };
    case "PRACTICE_PLAY_AGAIN":
      if (state.screen !== "practice") {
        return state;
      }

      return state;
    case "BACK_TO_REVIEW":
      if (state.screen !== "practice") {
        return state;
      }

      return { screen: "review", moveNumber: state.returnMoveNumber };
  }
}

type UseAppFlowOptions = {
  soundEnabled?: boolean;
};

export function useAppFlow({ soundEnabled = true }: UseAppFlowOptions = {}) {
  const [state, dispatch] = useReducer(appFlowReducer, initialAppFlowState);
  const { screen } = state;
  const game = useOthelloGame({
    enabled: screen === "game",
    soundEnabled,
  });
  const practiceGame = useOthelloGame({
    enabled: screen === "practice",
    soundEnabled,
  });
  const reviewMoveNumber = getCurrentReviewMoveNumber(state);
  const practiceFeedback = getPracticeFeedback(state, practiceGame);

  function startMatch(
    mode: GameMode,
    cpuLevel: CpuLevel,
    humanDisc: DiscColor,
  ) {
    game.setPlayers(createMatchPlayerSettings(mode, cpuLevel, humanDisc));
    game.startNewGame();
    dispatch({ type: "START_MATCH" });
  }

  function endGame() {
    game.endGame();
    dispatch({ type: "BACK_TO_START" });
  }

  function playAgain() {
    game.startNewGame();
    dispatch({ type: "PLAY_AGAIN" });
  }

  function backToStart() {
    game.resetGame();
    practiceGame.resetGame();
    dispatch({ type: "BACK_TO_START" });
  }

  function openSettings() {
    dispatch({ type: "OPEN_SETTINGS" });
  }

  function openReview() {
    dispatch({ type: "OPEN_REVIEW", moveNumber: game.moveHistory.length });
  }

  function backToResult() {
    dispatch({ type: "BACK_TO_RESULT" });
  }

  function startPractice(
    options: PracticeSessionOptions,
    feedbackContext: PracticeFeedbackContext | null = null,
  ) {
    copyPlayers(game, practiceGame);
    practiceGame.startPracticeSession(options);
    dispatch({
      type: "START_PRACTICE",
      feedbackContext,
      returnMoveNumber: getReviewMoveNumber(state, game.moveHistory.length),
      start: options,
    });
  }

  function practicePlayAgain() {
    if (state.screen !== "practice") {
      dispatch({ type: "BACK_TO_REVIEW" });
      return;
    }

    practiceGame.startPracticeSession(state.start);
    dispatch({ type: "PRACTICE_PLAY_AGAIN" });
  }

  function backToReview() {
    dispatch({ type: "BACK_TO_REVIEW" });
  }

  function selectReviewMove(moveNumber: number) {
    dispatch({ type: "SELECT_REVIEW_MOVE", moveNumber });
  }

  return {
    game,
    practiceGame,
    practiceFeedback,
    reviewMoveNumber,
    screen,
    backToResult,
    backToReview,
    backToStart,
    endGame,
    openReview,
    openSettings,
    playAgain,
    practicePlayAgain,
    selectReviewMove,
    startMatch,
    startPractice,
  };
}

function getPracticeFeedback(
  state: AppFlowState,
  practiceGame: OthelloGameController,
): PracticeFeedback | null {
  if (state.screen !== "practice") {
    return null;
  }

  return createPracticeFeedback(
    state.feedbackContext,
    getFirstHumanPracticeMove(practiceGame.moveHistory, practiceGame.players),
  );
}

export function getFirstHumanPracticeMove(
  moveHistory: MoveRecord[],
  players: PlayerSettings,
): MoveRecord | null {
  return (
    moveHistory.find((move) => players[move.disc].type === "human") ?? null
  );
}

function copyPlayers(
  source: OthelloGameController,
  target: OthelloGameController,
) {
  target.setPlayers(source.players);
}

function getReviewMoveNumber(
  state: AppFlowState,
  fallbackMoveNumber: number,
): number {
  if (state.screen === "review") {
    return state.moveNumber;
  }

  if (state.screen === "practice") {
    return state.returnMoveNumber;
  }

  return fallbackMoveNumber;
}

function getCurrentReviewMoveNumber(state: AppFlowState): number | null {
  if (state.screen === "review") {
    return state.moveNumber;
  }

  if (state.screen === "practice") {
    return state.returnMoveNumber;
  }

  return null;
}
