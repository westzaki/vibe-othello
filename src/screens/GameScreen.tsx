import { lazy, Suspense, useMemo } from "react";
import { calculateAdvantage } from "../cpu/advantage";
import { AdvantageBar } from "../components/AdvantageBar";
import { Board } from "../components/Board";
import { GameHeader } from "../components/GameHeader";
import type { useOthelloGame } from "../hooks/useOthelloGame";

const DevDebugPanel = import.meta.env.DEV
  ? lazy(() =>
      import("../debug/DebugPanel").then((module) => ({
        default: module.DebugPanel,
      })),
    )
  : null;

type GameScreenProps = {
  game: ReturnType<typeof useOthelloGame>;
  onBackToStart: () => void;
  onEndGame: () => void;
};

export function GameScreen({
  game,
  onBackToStart,
  onEndGame,
}: GameScreenProps) {
  const advantage = useMemo(() => calculateAdvantage(game.board), [game.board]);

  return (
    <section className="game-shell" aria-labelledby="game-title">
      <aside className="game-sidebar" aria-label="Game controls and status">
        <GameHeader
          currentDisc={game.currentDisc}
          discCounts={game.discCounts}
          endReason={game.endReason}
          gameStatus={game.gameStatus}
          isPlaying={game.isPlaying}
          message={game.message}
          onEndGame={onEndGame}
          onNewGame={onBackToStart}
          winner={game.winner}
        />

        <AdvantageBar advantage={advantage} />
      </aside>

      <div className="game-table">
        <Board
          board={game.board}
          currentDisc={game.currentDisc}
          flipAnimationId={game.flipAnimationId}
          flippedSquares={game.flippedSquares}
          lastMove={game.lastMove}
          legalMoves={game.canHumanPlay ? game.legalMoves : []}
          onSquareClick={game.placeCurrentDisc}
        />
      </div>

      {DevDebugPanel !== null && (
        <Suspense fallback={null}>
          <DevDebugPanel onReplaceSession={game.replaceSession} />
        </Suspense>
      )}
    </section>
  );
}
