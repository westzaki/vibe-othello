import { useState } from "react";
import type { CpuLevel } from "../cpu";
import type { DiscColor } from "../game/othello";
import { createMatchPlayerSettings, type GameMode } from "../game/matchSetup";
import type { PracticeSessionOptions } from "../game/session";
import { useOthelloGame } from "./useOthelloGame";

export type AppScreen = "start" | "game" | "review" | "practice";

export function useAppFlow() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const game = useOthelloGame({ enabled: screen === "game" });
  const practiceGame = useOthelloGame({ enabled: screen === "practice" });
  const [practiceStart, setPracticeStart] =
    useState<PracticeSessionOptions | null>(null);
  const [reviewMoveNumber, setReviewMoveNumber] = useState<number | null>(null);

  function startMatch(
    mode: GameMode,
    cpuLevel: CpuLevel,
    humanDisc: DiscColor,
  ) {
    game.setPlayers(createMatchPlayerSettings(mode, cpuLevel, humanDisc));
    game.startNewGame();
    setReviewMoveNumber(null);
    setPracticeStart(null);
    setScreen("game");
  }

  function endGame() {
    game.endGame();
    setScreen("start");
  }

  function playAgain() {
    game.startNewGame();
    setReviewMoveNumber(null);
    setPracticeStart(null);
    setScreen("game");
  }

  function backToStart() {
    game.resetGame();
    practiceGame.resetGame();
    setPracticeStart(null);
    setReviewMoveNumber(null);
    setScreen("start");
  }

  function openReview() {
    setReviewMoveNumber(game.moveHistory.length);
    setScreen("review");
  }

  function backToResult() {
    setScreen("game");
  }

  function startPractice(options: PracticeSessionOptions) {
    copyPlayers(game, practiceGame);
    practiceGame.startPracticeSession(options);
    setPracticeStart(options);
    setScreen("practice");
  }

  function practicePlayAgain() {
    if (practiceStart === null) {
      setScreen("review");
      return;
    }

    practiceGame.startPracticeSession(practiceStart);
    setScreen("practice");
  }

  function backToReview() {
    setScreen("review");
  }

  function selectReviewMove(moveNumber: number) {
    setReviewMoveNumber(moveNumber);
  }

  return {
    game,
    practiceGame,
    reviewMoveNumber,
    screen,
    backToResult,
    backToReview,
    backToStart,
    endGame,
    openReview,
    playAgain,
    practicePlayAgain,
    selectReviewMove,
    startMatch,
    startPractice,
  };
}

function copyPlayers(
  source: ReturnType<typeof useOthelloGame>,
  target: ReturnType<typeof useOthelloGame>,
) {
  target.setPlayers(source.players);
}
