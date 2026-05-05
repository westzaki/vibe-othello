import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AdvantageBar } from "../components/AdvantageBar";
import { Board } from "../components/Board";
import { GameHeader } from "../components/GameHeader";
import { GameResultOverlay } from "../components/GameResultOverlay";
import { MoveHistory } from "../components/MoveHistory";
import type { OthelloGameController } from "../hooks/useOthelloGame";
import { usePassNoticeVisibility } from "../hooks/usePassNoticeVisibility";
import { usePlayCoachHintModel } from "../hooks/usePlayCoachHintModel";
import { usePlayPositionAnalysisResult } from "../hooks/usePlayPositionAnalysis";
import {
  canRequestCoachAnalysis,
  canShowCoachHintAfterOpening,
  canShowCoachBestMoveHint,
  createCoachHintDebugSnapshot,
  createCoachPlayPositionAnalysisOptions,
  defaultCoachHintSettings,
  getCoachHintDelayMs,
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
  const canAnalyzeCoachHints =
    mode === "match" &&
    coachHintSettings.mode !== "off" &&
    game.canHumanPlay &&
    !game.isCpuThinking &&
    canShowCoachHintAfterOpening(game.session);
  const coachAnalysisDelayMs = getCoachHintDelayMs(coachHintSettings.mode);
  const coachAnalysisRequestKey = useMemo(
    () =>
      createCoachAnalysisRequestKey({
        canAnalyzeCoachHints,
        mode,
        session: game.session,
        settings: coachHintSettings,
      }),
    [canAnalyzeCoachHints, coachHintSettings, game.session, mode],
  );
  const [coachAnalysisRequestedKey, setCoachAnalysisRequestedKey] = useState<
    string | null
  >(null);
  const shouldRequestCoachAnalysis =
    coachAnalysisRequestedKey === coachAnalysisRequestKey;
  const shouldRequestBestMoveAnalysis = shouldRequestCoachAnalysis;
  const playPositionAnalysisOptions = useMemo(
    () =>
      createCoachPlayPositionAnalysisOptions(
        canAnalyzeCoachHints && shouldRequestCoachAnalysis
          ? coachHintSettings.mode
          : "off",
        {
          includeBestMoveHint:
            shouldRequestBestMoveAnalysis &&
            canShowCoachBestMoveHint(game.session),
        },
      ),
    [
      canAnalyzeCoachHints,
      coachHintSettings.mode,
      game.session,
      shouldRequestCoachAnalysis,
      shouldRequestBestMoveAnalysis,
    ],
  );
  const playPositionAnalysisResult = usePlayPositionAnalysisResult(
    game.session,
    playPositionAnalysisOptions,
  );
  const playPositionAnalysis = playPositionAnalysisResult.analysis;
  const latestCoachAnalysisRequestRef = useRef({
    advantage: playPositionAnalysis.advantage,
    canAnalyzeCoachHints,
    game,
  });

  useEffect(() => {
    latestCoachAnalysisRequestRef.current = {
      advantage: playPositionAnalysis.advantage,
      canAnalyzeCoachHints,
      game,
    };
  }, [canAnalyzeCoachHints, game, playPositionAnalysis.advantage]);

  useEffect(() => {
    if (coachAnalysisDelayMs === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const latestRequest = latestCoachAnalysisRequestRef.current;

      if (
        canRequestCoachAnalysis({
          advantage: latestRequest.advantage,
          enabled: latestRequest.canAnalyzeCoachHints,
          isCpuThinking: latestRequest.game.isCpuThinking,
          players: latestRequest.game.players,
          session: latestRequest.game.session,
          settings: coachHintSettings,
          thinkingTimeMs: coachAnalysisDelayMs,
        })
      ) {
        setCoachAnalysisRequestedKey(coachAnalysisRequestKey);
      }
    }, coachAnalysisDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [coachAnalysisDelayMs, coachAnalysisRequestKey, coachHintSettings]);
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
  const coachHintDebugSnapshot = useMemo(
    () =>
      import.meta.env.DEV
        ? createCoachHintDebugSnapshot({
            analysis: playPositionAnalysis,
            analysisStatus: playPositionAnalysisResult.debug.status,
            canRequestAnalysisAtDelay:
              coachAnalysisDelayMs !== null &&
              canRequestCoachAnalysis({
                advantage: playPositionAnalysis.advantage,
                enabled: canAnalyzeCoachHints,
                isCpuThinking: game.isCpuThinking,
                players: game.players,
                session: game.session,
                settings: coachHintSettings,
                thinkingTimeMs: coachAnalysisDelayMs,
              }),
            enabled: mode === "match",
            isAnalysisRequested: shouldRequestCoachAnalysis,
            isCpuThinking: game.isCpuThinking,
            model: coachHintModel,
            players: game.players,
            session: game.session,
            settings: coachHintSettings,
          })
        : null,
    [
      canAnalyzeCoachHints,
      coachAnalysisDelayMs,
      coachHintModel,
      coachHintSettings,
      game.isCpuThinking,
      game.players,
      game.session,
      mode,
      playPositionAnalysis,
      playPositionAnalysisResult.debug.status,
      shouldRequestCoachAnalysis,
    ],
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
          <DevDebugPanel
            coachHintDebug={coachHintDebugSnapshot}
            onReplaceSession={game.replaceSession}
          />
        </Suspense>
      )}
    </section>
  );
}

function createCoachAnalysisRequestKey({
  canAnalyzeCoachHints,
  mode,
  session,
  settings,
}: {
  canAnalyzeCoachHints: boolean;
  mode: GameScreenProps["mode"];
  session: OthelloGameController["session"];
  settings: CoachHintSettings;
}): string {
  return [
    canAnalyzeCoachHints ? "coach-ready" : "coach-idle",
    mode ?? "match",
    settings.mode,
    session.status,
    session.currentDisc,
    session.moveHistory.length,
    session.lastMove ?? "none",
    session.board.join(","),
  ].join("|");
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
