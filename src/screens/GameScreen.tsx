import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { calculateAdvantage } from "../cpu";
import { AdvantageBar } from "../components/AdvantageBar";
import { Board } from "../components/Board";
import { GameHeader } from "../components/GameHeader";
import { GameResultOverlay } from "../components/GameResultOverlay";
import { MoveHistory } from "../components/MoveHistory";
import type { DiscColor } from "../game/othello";
import type { GameSessionNotice } from "../game/session";
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
  const passNotice = game.notice?.type === "pass" ? game.notice : null;
  const passNoticeKey =
    passNotice === null
      ? null
      : [
          game.moveHistory.length,
          game.lastMove ?? "none",
          passNotice.skippedDisc,
          passNotice.nextDisc,
        ].join(":");
  const [hiddenPassNoticeKey, setHiddenPassNoticeKey] = useState<string | null>(
    null,
  );
  const resultWinner =
    game.gameStatus === "ended" &&
    game.endReason === "completed" &&
    game.winner !== null
      ? game.winner
      : null;

  useEffect(() => {
    if (passNoticeKey === null) {
      const resetTimeoutId = window.setTimeout(() => {
        setHiddenPassNoticeKey(null);
      }, 0);

      return () => window.clearTimeout(resetTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      setHiddenPassNoticeKey(passNoticeKey);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [passNoticeKey]);

  return (
    <section className="game-shell" aria-label="Othello game">
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

      <div className="game-side-rail">
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
                mode === "match" && canOpenReview(game)
                  ? onOpenReview
                  : undefined
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

        <div className="game-history-panel">
          <MoveHistory moves={game.moveHistory} />
        </div>
      </div>

      {passNotice !== null &&
        passNoticeKey !== null &&
        hiddenPassNoticeKey !== passNoticeKey && (
          <PassNoticeOverlay notice={passNotice} />
        )}

      {DevDebugPanel !== null && (
        <Suspense fallback={null}>
          <DevDebugPanel onReplaceSession={game.replaceSession} />
        </Suspense>
      )}
    </section>
  );
}

function PassNoticeOverlay({ notice }: { notice: GameSessionNotice }) {
  return (
    <div className="pass-notice-overlay" role="status" aria-live="polite">
      <div className="pass-notice-overlay__card">
        <span
          className={`pass-notice-overlay__disc pass-notice-overlay__disc--${notice.skippedDisc}`}
          aria-hidden="true"
        />
        <div>
          <p className="pass-notice-overlay__title">
            {formatDisc(notice.skippedDisc)}は置ける場所がないみたい
          </p>
          <p className="pass-notice-overlay__text">
            {formatDisc(notice.nextDisc)}がもう一度打つよ
          </p>
        </div>
      </div>
    </div>
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

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "黒" : "白";
}
