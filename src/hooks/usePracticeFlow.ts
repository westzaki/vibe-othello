import type { Dispatch } from "react";
import type { PlayerSettings } from "../game/players";
import type { MoveRecord, PracticeSessionOptions } from "../game/session";
import {
  createPracticeFeedback,
  type PracticeFeedback,
  type PracticeFeedbackContext,
} from "../teacher";
import type { AppFlowAction, AppFlowState } from "./useAppFlow";
import type { OthelloGameController } from "./useOthelloGame";

type UsePracticeFlowOptions = {
  dispatch: Dispatch<AppFlowAction>;
  game: OthelloGameController;
  practiceGame: OthelloGameController;
  state: AppFlowState;
};

export type PracticeFlowController = {
  practiceFeedback: PracticeFeedback | null;
  backToReview: () => void;
  practicePlayAgain: () => void;
  startPractice: (
    options: PracticeSessionOptions,
    feedbackContext?: PracticeFeedbackContext | null,
  ) => void;
};

export function usePracticeFlow({
  dispatch,
  game,
  practiceGame,
  state,
}: UsePracticeFlowOptions): PracticeFlowController {
  const practiceFeedback = getPracticeFeedback(state, practiceGame);

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

  return {
    practiceFeedback,
    backToReview,
    practicePlayAgain,
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
