import { lazy, Suspense } from "react";
import { Board } from "./components/Board";
import { GameHeader } from "./components/GameHeader";
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
          gameStatus={game.gameStatus}
          isPlaying={game.isPlaying}
          onEndGame={game.endGame}
          onNewGame={game.startNewGame}
          winner={game.winner}
        />

        <Board
          board={game.board}
          currentDisc={game.currentDisc}
          lastMove={game.lastMove}
          legalMoves={game.legalMoves}
          onSquareClick={game.placeCurrentDisc}
        />

        {DevDebugPanel !== null && (
          <Suspense fallback={null}>
            <DevDebugPanel onReplaceSession={game.replaceSession} />
          </Suspense>
        )}
      </section>
    </main>
  );
}
