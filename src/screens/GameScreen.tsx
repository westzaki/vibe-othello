import { lazy, Suspense, useMemo } from "react";
import { AdvantageBar } from "../components/AdvantageBar";
import { Board } from "../components/Board";
import { GameHeader } from "../components/GameHeader";
import { GameResultOverlay } from "../components/GameResultOverlay";
import { MoveHistory } from "../components/MoveHistory";
import type { OthelloGameController } from "../hooks/useOthelloGame";
import { usePassNoticeVisibility } from "../hooks/usePassNoticeVisibility";
import { usePlayCoachHintModel } from "../hooks/usePlayCoachHintModel";
import { usePlayPositionAnalysis } from "../hooks/usePlayPositionAnalysis";
import {
  defaultCoachHintSettings,
  type CoachHintSettings,
} from "../teacher";
import { CoachHintPanel } from "./game/CoachHintPanel";
import { createCoachHintMarkers } from "./game/coachHintMarkers";
import { PassNoticeOverlay } from "./game/PassNoticeOverlay";
import { PracticeBanner } from "./game/PracticeBanner";

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
  showAdvantageBar?: boolean;
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
  showAdvantageBar = true,
}: GameScreenProps) {
  const playPositionAnalysisOptions = useMemo(
    () =>
      ({
        includeCandidateFallback: coachHintSettings.mode === "active",
        messageStyle:
          coachHintSettings.mode === "gentle" ? "vague" : "specific",
      }) as const,
    [coachHintSettings.mode],
  );
  const playPositionAnalysis = usePlayPositionAnalysis(
    game.session,
    playPositionAnalysisOptions,
  );
  const { isPassNoticeVisible, passNotice } = usePassNoticeVisibility({
    lastMove: game.lastMove,
    moveCount: game.moveHistory.length,
    notice: game.notice,
  });
  const coachHintModel = usePlayCoachHintModel({
    advantage: playPositionAnalysis.advantage,
    analysis: playPositionAnalysis,
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
            <PracticeBanner
              feedbackText={practiceFeedbackText}
              onBackToReview={onBackToReview}
            />
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

              {showAdvantageBar && (
                <AdvantageBar
                  advantage={playPositionAnalysis.advantage}
                  players={game.players}
                />
              )}

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
