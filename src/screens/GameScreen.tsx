import { lazy, Suspense, useMemo } from "react";
import { calculateAdvantage } from "../cpu";
import { AdvantageBar } from "../components/AdvantageBar";
import { Board } from "../components/Board";
import { GameHeader } from "../components/GameHeader";
import { GameResultOverlay } from "../components/GameResultOverlay";
import { MoveHistory } from "../components/MoveHistory";
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
  onPlayAgain: () => void;
};

export function GameScreen({
  game,
  onBackToStart,
  onEndGame,
  onPlayAgain,
}: GameScreenProps) {
  const advantage = useMemo(() => calculateAdvantage(game.board), [game.board]);
  const resultWinner =
    game.gameStatus === "ended" &&
    game.endReason === "completed" &&
    game.winner !== null
      ? game.winner
      : null;

  return (
    <section className="game-shell" aria-label="Othello game">
      <aside className="game-sidebar" aria-label="Game controls and status">
        {resultWinner !== null ? (
          <GameResultOverlay
            discCounts={game.discCounts}
            onBackToStart={onBackToStart}
            onPlayAgain={onPlayAgain}
            winner={resultWinner}
          />
        ) : (
          <>
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
          </>
        )}

        <MoveHistory moves={game.moveHistory} />
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
