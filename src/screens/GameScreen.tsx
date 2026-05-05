import { lazy, Suspense, useMemo } from "react";
import { calculateAdvantage } from "../cpu";
import { AdvantageBar } from "../components/AdvantageBar";
import {
  Board,
  type BoardHintMarker,
  type BoardHintTone,
} from "../components/Board";
import { GameHeader } from "../components/GameHeader";
import { GameResultOverlay } from "../components/GameResultOverlay";
import { MoveHistory } from "../components/MoveHistory";
import type { DiscColor } from "../game/othello";
import type { GameSessionNotice } from "../game/session";
import type { OthelloGameController } from "../hooks/useOthelloGame";
import { usePassNoticeVisibility } from "../hooks/usePassNoticeVisibility";
import { usePlayCoachHintModel } from "../hooks/usePlayCoachHintModel";
import {
  defaultCoachHintSettings,
  type CoachHintModel,
  type CoachHintSettings,
} from "../teacher";

const DevDebugPanel = import.meta.env.DEV
  ? lazy(() =>
      import("../debug/DebugPanel").then((module) => ({
        default: module.DebugPanel,
      })),
    )
  : null;

type GameScreenProps = {
  coachHintSettings?: CoachHintSettings;
  game: OthelloGameController;
  mode?: "match" | "practice";
  onBackToReview?: () => void;
  onBackToStart: () => void;
  onEndGame: () => void;
  onOpenReview: () => void;
  onPlayAgain: () => void;
  practiceFeedbackText?: string | null;
};

export function GameScreen({
  coachHintSettings = defaultCoachHintSettings,
  game,
  mode = "match",
  onBackToReview,
  onBackToStart,
  onEndGame,
  onOpenReview,
  onPlayAgain,
  practiceFeedbackText = null,
}: GameScreenProps) {
  const advantage = useMemo(
    () => calculateAdvantage(game.board, game.currentDisc),
    [game.board, game.currentDisc],
  );
  const { isPassNoticeVisible, passNotice } = usePassNoticeVisibility({
    lastMove: game.lastMove,
    moveCount: game.moveHistory.length,
    notice: game.notice,
  });
  const coachHintModel = usePlayCoachHintModel({
    enabled: mode === "match",
    isCpuThinking: game.isCpuThinking,
    players: game.players,
    session: game.session,
    settings: coachHintSettings,
  });
  const coachHintMarkers = useMemo(
    () => createCoachHintMarkers(coachHintModel),
    [coachHintModel],
  );
  const displayedAdvantage = coachHintModel?.analysis.advantage ?? advantage;
  const resultWinner =
    game.gameStatus === "ended" &&
    game.endReason === "completed" &&
    game.winner !== null
      ? game.winner
      : null;

  return (
    <section className="game-shell" aria-label="Othello game">
      <div className="game-table">
        <Board
          board={game.board}
          coachHintMarkers={coachHintMarkers}
          currentDisc={game.currentDisc}
          flipAnimationId={game.flipAnimationId}
          flippedSquares={game.flippedSquares}
          lastMove={game.lastMove}
          legalMoves={game.canHumanPlay ? game.legalMoves : []}
          onSquareClick={game.placeCurrentDisc}
          placedSquare={game.placedSquare}
        />
      </div>

      <div className="game-side-rail">
        <aside className="game-sidebar" aria-label="Game controls and status">
          {mode === "practice" && (
            <div className="practice-banner" aria-label="Practice session">
              <span>練習モード</span>
              <strong>ふりかえりから練習中</strong>
              {practiceFeedbackText !== null && (
                <p className="practice-banner__feedback" role="status">
                  {practiceFeedbackText}
                </p>
              )}
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
              players={game.players}
              winner={resultWinner}
            />
          ) : (
            <>
              <GameHeader
                currentDisc={game.currentDisc}
                discCounts={game.discCounts}
                endReason={game.endReason}
                gameStatus={game.gameStatus}
                isCpuThinking={game.isCpuThinking}
                isPlaying={game.isPlaying}
                isUndoDisabled={!game.canUndo || game.isCpuThinking}
                onEndGame={onEndGame}
                onNewGame={onBackToStart}
                onUndo={game.undoMove}
                players={game.players}
                showUndo={game.undoEnabled}
                winner={game.winner}
              />

              <AdvantageBar
                advantage={displayedAdvantage}
                players={game.players}
              />

              {mode === "match" && coachHintSettings.mode !== "off" && (
                <CoachHintPanel model={coachHintModel} />
              )}
            </>
          )}
        </aside>

        <div className="game-history-panel">
          <MoveHistory moves={game.moveHistory} />
        </div>
      </div>

      {isPassNoticeVisible && passNotice !== null && (
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

function CoachHintPanel({ model }: { model: CoachHintModel | null }) {
  if (model === null) {
    return <div className="coach-hint coach-hint--empty" aria-hidden="true" />;
  }

  return (
    <div
      className={[
        "coach-hint",
        `coach-hint--${model.mode}`,
        model.hints.some((hint) => hint.kind === "cornerRisk")
          ? "coach-hint--has-risk"
          : "coach-hint--helpful",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      {model.hints.map((hint) => {
        const isRiskHint = hint.kind === "cornerRisk";

        return (
          <div
            className={[
              "coach-hint__item",
              isRiskHint
                ? "coach-hint__item--risk"
                : "coach-hint__item--helpful",
            ].join(" ")}
            key={`${hint.kind}-${hint.square ?? "none"}`}
          >
            <span className="coach-hint__label">
              {isRiskHint ? "気をつけて" : "見てみよう"}
            </span>
            <p>{hint.message}</p>
          </div>
        );
      })}
    </div>
  );
}

function createCoachHintMarkers(
  model: CoachHintModel | null,
): BoardHintMarker[] {
  if (model === null) {
    return [];
  }

  return model.hints.flatMap((hint) => {
    if (hint.square === null) {
      return [];
    }

    return [
      {
        square: hint.square,
        tone: getCoachHintTone(hint),
      },
    ];
  });
}

function getCoachHintTone(hint: CoachHintModel["hint"]): BoardHintTone {
  return hint.kind === "cornerRisk" ? "risk" : "helpful";
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

function canOpenReview(game: OthelloGameController): boolean {
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
