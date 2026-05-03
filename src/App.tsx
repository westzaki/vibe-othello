import { useState } from "react";
import type { DiscColor } from "./game/othello";
import type { CpuLevel } from "./game/players";
import {
  createMatchPlayerSettings,
  getInitialGameMode,
  getInitialHumanDisc,
  type GameMode,
} from "./game/matchSetup";
import type { PracticeSessionOptions } from "./game/session";
import { useOthelloGame } from "./hooks/useOthelloGame";
import { GameScreen } from "./screens/GameScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { StartScreen } from "./screens/StartScreen";

type AppScreen = "start" | "game" | "review" | "practice";

export default function App() {
  const game = useOthelloGame();
  const practiceGame = useOthelloGame();
  const [screen, setScreen] = useState<AppScreen>("start");
  const [practiceStart, setPracticeStart] =
    useState<PracticeSessionOptions | null>(null);
  const [reviewMoveNumber, setReviewMoveNumber] = useState<number | null>(null);

  function handleStartMatch(
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

  function handleEndGame() {
    game.endGame();
    setScreen("start");
  }

  function handlePlayAgain() {
    game.startNewGame();
    setReviewMoveNumber(null);
    setPracticeStart(null);
    setScreen("game");
  }

  function handleBackToStart() {
    game.resetGame();
    practiceGame.resetGame();
    setPracticeStart(null);
    setReviewMoveNumber(null);
    setScreen("start");
  }

  function handleOpenReview() {
    setReviewMoveNumber(game.moveHistory.length);
    setScreen("review");
  }

  function handleBackToResult() {
    setScreen("game");
  }

  function handleStartPractice(options: PracticeSessionOptions) {
    copyPlayers(game, practiceGame);
    practiceGame.startPracticeSession(options);
    setPracticeStart(options);
    setScreen("practice");
  }

  function handlePracticePlayAgain() {
    if (practiceStart === null) {
      setScreen("review");
      return;
    }

    practiceGame.startPracticeSession(practiceStart);
    setScreen("practice");
  }

  return (
    <main className="app">
      {screen === "start" ? (
        <StartScreen
          initialCpuLevel={game.players.white.cpuLevel}
          initialHumanDisc={getInitialHumanDisc(game.players)}
          initialMode={getInitialGameMode(game.players)}
          onStart={handleStartMatch}
        />
      ) : screen === "review" ? (
        <ReviewScreen
          currentMoveNumber={reviewMoveNumber ?? game.moveHistory.length}
          game={game}
          onBackToResult={handleBackToResult}
          onBackToStart={handleBackToStart}
          onMoveNumberChange={setReviewMoveNumber}
          onStartPractice={handleStartPractice}
        />
      ) : screen === "practice" ? (
        <GameScreen
          game={practiceGame}
          mode="practice"
          onBackToReview={() => setScreen("review")}
          onBackToStart={handleBackToStart}
          onEndGame={practiceGame.endGame}
          onOpenReview={() => setScreen("review")}
          onPlayAgain={handlePracticePlayAgain}
        />
      ) : (
        <GameScreen
          game={game}
          onBackToStart={handleBackToStart}
          onEndGame={handleEndGame}
          onOpenReview={handleOpenReview}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </main>
  );
}

function copyPlayers(
  source: ReturnType<typeof useOthelloGame>,
  target: ReturnType<typeof useOthelloGame>,
) {
  target.setPlayers(source.players);
}
