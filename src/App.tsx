import { useState } from "react";
import type { DiscColor } from "./game/othello";
import type { CpuLevel } from "./game/players";
import { useOthelloGame } from "./hooks/useOthelloGame";
import { GameScreen } from "./screens/GameScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { StartScreen, type GameMode } from "./screens/StartScreen";

type AppScreen = "start" | "game" | "review";

export default function App() {
  const game = useOthelloGame();
  const [screen, setScreen] = useState<AppScreen>("start");

  function handleStartMatch(
    mode: GameMode,
    cpuLevel: CpuLevel,
    humanDisc: DiscColor,
  ) {
    const cpuDisc = humanDisc === "black" ? "white" : "black";

    game.setPlayerType("black", "human");
    game.setPlayerType("white", "human");

    if (mode === "onePlayer") {
      game.setPlayerType(cpuDisc, "cpu");
      game.setCpuLevel(cpuDisc, cpuLevel);
    }

    game.startNewGame();
    setScreen("game");
  }

  function handleEndGame() {
    game.endGame();
    setScreen("start");
  }

  function handlePlayAgain() {
    game.startNewGame();
    setScreen("game");
  }

  function handleBackToStart() {
    game.resetGame();
    setScreen("start");
  }

  function handleOpenReview() {
    setScreen("review");
  }

  function handleBackToResult() {
    setScreen("game");
  }

  return (
    <main className="app">
      {screen === "start" ? (
        <StartScreen
          initialCpuLevel={game.players.white.cpuLevel}
          initialHumanDisc={
            game.players.black.type === "cpu" ? "white" : "black"
          }
          initialMode={
            game.players.black.type === "cpu" ||
            game.players.white.type === "cpu"
              ? "onePlayer"
              : "twoPlayer"
          }
          onStart={handleStartMatch}
        />
      ) : screen === "review" ? (
        <ReviewScreen
          game={game}
          onBackToResult={handleBackToResult}
          onBackToStart={handleBackToStart}
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
