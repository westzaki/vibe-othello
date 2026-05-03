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
  mode?: "match" | "practice";
  onBackToReview?: () => void;
  onBackToStart: () => void;
  onEndGame: () => void;
  onOpenReview: () => void;
  onPlayAgain: () => void;
};

export function GameScreen({
  game,
  mode = "match",
  onBackToReview,
  onBackToStart,
  onEndGame,
  onOpenReview,
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
        {mode === "practice" && (
          <div className="practice-banner" aria-label="Practice session">
            <span>練習モード</span>
            <strong>ふりかえりから練習中</strong>
            {onBackToReview !== undefined && (
              <button
                className="game-action"
                onClick={onBackToReview}
                type="button"
              >
                ふりかえりへ
              </button>
            )}
          </div>
        )}

        {resultWinner !== null ? (
          <GameResultOverlay
            discCounts={game.discCounts}
            onBackToStart={onBackToStart}
            onOpenReview={
              mode === "match" && canOpenReview(game) ? onOpenReview : undefined
            }
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
              isUndoDisabled={game.isCpuThinking}
              message={game.message}
              onEndGame={onEndGame}
              onNewGame={onBackToStart}
              onUndo={game.undoMove}
              showUndo={game.canUndo}
              winner={game.winner}
            />

            <AdvantageBar advantage={advantage} />
          </>
        )}

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

      <div className="game-history-panel">
        <MoveHistory moves={game.moveHistory} />
      </div>

      {DevDebugPanel !== null && (
        <Suspense fallback={null}>
          <DevDebugPanel onReplaceSession={game.replaceSession} />
        </Suspense>
      )}
    </section>
  );
}

function canOpenReview(game: ReturnType<typeof useOthelloGame>): boolean {
  return (
    game.gameStatus === "ended" &&
    game.endReason === "completed" &&
    ((game.players.black.type === "human" &&
      game.players.white.type === "cpu") ||
      (game.players.white.type === "human" &&
        game.players.black.type === "cpu"))
  );
}
