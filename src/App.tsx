import { useState } from "react";
import type { CpuLevel } from "./game/players";
import { useOthelloGame } from "./hooks/useOthelloGame";
import { GameScreen } from "./screens/GameScreen";
import { StartScreen, type GameMode } from "./screens/StartScreen";

type AppScreen = "start" | "game";

export default function App() {
  const game = useOthelloGame();
  const [screen, setScreen] = useState<AppScreen>("start");

  function handleStartMatch(mode: GameMode, cpuLevel: CpuLevel) {
    game.setPlayerType("black", "human");
    game.setPlayerType("white", mode === "onePlayer" ? "cpu" : "human");
    game.setCpuLevel("white", cpuLevel);
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

  return (
    <main className="app">
      {screen === "start" ? (
        <StartScreen
          initialCpuLevel={game.players.white.cpuLevel}
          initialMode={
            game.players.white.type === "cpu" ? "onePlayer" : "twoPlayer"
          }
          onStart={handleStartMatch}
        />
      ) : (
        <GameScreen
          game={game}
          onBackToStart={handleBackToStart}
          onEndGame={handleEndGame}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </main>
  );
}
