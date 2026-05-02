import { lazy, Suspense } from "react";
import { Board } from "./components/Board";
import { GameHeader } from "./components/GameHeader";
import { GameResultOverlay } from "./components/GameResultOverlay";
import { PlayerControls } from "./components/PlayerControls";
import { useOthelloGame } from "./hooks/useOthelloGame";

const DevDebugPanel = import.meta.env.DEV
  ? lazy(() =>
      import("./debug/DebugPanel").then((module) => ({
        default: module.DebugPanel,
      })),
    )
  : null;

export default function App() {
  const game = useOthelloGame();

  return (
    <main className="app">
      <section className="game-shell" aria-labelledby="game-title">
        <GameHeader
          currentDisc={game.currentDisc}
          discCounts={game.discCounts}
          endReason={game.endReason}
          gameStatus={game.gameStatus}
          isPlaying={game.isPlaying}
          message={game.message}
          onEndGame={game.endGame}
          onNewGame={game.startNewGame}
          winner={game.winner}
        />

        <PlayerControls
          disabled={game.isPlaying}
          onCpuLevelChange={game.setCpuLevel}
          onPlayerTypeChange={game.setPlayerType}
          players={game.players}
        />

        <Board
          board={game.board}
          currentDisc={game.currentDisc}
          flipAnimationId={game.flipAnimationId}
          flippedSquares={game.flippedSquares}
          lastMove={game.lastMove}
          legalMoves={game.canHumanPlay ? game.legalMoves : []}
          onSquareClick={game.placeCurrentDisc}
        />

        {DevDebugPanel !== null && (
          <Suspense fallback={null}>
            <DevDebugPanel onReplaceSession={game.replaceSession} />
          </Suspense>
        )}

        {game.gameStatus === "ended" &&
          game.endReason === "completed" &&
          game.winner !== null && (
            <GameResultOverlay
              discCounts={game.discCounts}
              onPlayAgain={game.resetGame}
              winner={game.winner}
            />
          )}
      </section>
    </main>
  );
}
