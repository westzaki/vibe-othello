import { useEffect, useMemo, useRef, useState } from "react";
import {
  canRequestCoachAnalysis,
  canShowCoachBestMoveHint,
  canShowCoachHintAfterOpening,
  createCoachPlayPositionAnalysisOptions,
  getCoachHintDelayMs,
  type CoachHintSettings,
  type PlayPositionAnalysis,
} from "../teacher";
import type { OthelloGameController } from "./useOthelloGame";
import {
  usePlayPositionAnalysisResult,
  type PlayPositionAnalysisDebugStatus,
} from "./usePlayPositionAnalysis";

export type PlayCoachAnalysisMode = "match" | "practice";

export type PlayCoachAnalysisState = {
  analysis: PlayPositionAnalysis;
  debugStatus: PlayPositionAnalysisDebugStatus;
  canRequestAnalysisAtDelay: boolean;
  shouldRequestCoachAnalysis: boolean;
};

type UsePlayCoachAnalysisParams = {
  game: OthelloGameController;
  mode: PlayCoachAnalysisMode;
  settings: CoachHintSettings;
};

export function usePlayCoachAnalysis({
  game,
  mode,
  settings,
}: UsePlayCoachAnalysisParams): PlayCoachAnalysisState {
  const canAnalyzeCoachHints =
    mode === "match" &&
    settings.mode !== "off" &&
    game.canHumanPlay &&
    !game.isCpuThinking &&
    canShowCoachHintAfterOpening(game.session);
  const coachAnalysisDelayMs = getCoachHintDelayMs(settings.mode);
  const coachAnalysisRequestKey = useMemo(
    () =>
      createCoachAnalysisRequestKey({
        canAnalyzeCoachHints,
        mode,
        session: game.session,
        settings,
      }),
    [canAnalyzeCoachHints, game.session, mode, settings],
  );
  const [coachAnalysisRequestedKey, setCoachAnalysisRequestedKey] = useState<
    string | null
  >(null);
  const shouldRequestCoachAnalysis =
    coachAnalysisRequestedKey === coachAnalysisRequestKey;
  const playPositionAnalysisOptions = useMemo(
    () =>
      createCoachPlayPositionAnalysisOptions(
        canAnalyzeCoachHints && shouldRequestCoachAnalysis
          ? settings.mode
          : "off",
        {
          includeBestMoveHint:
            shouldRequestCoachAnalysis && canShowCoachBestMoveHint(game.session),
        },
      ),
    [
      canAnalyzeCoachHints,
      game.session,
      settings.mode,
      shouldRequestCoachAnalysis,
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
          settings,
          thinkingTimeMs: coachAnalysisDelayMs,
        })
      ) {
        setCoachAnalysisRequestedKey(coachAnalysisRequestKey);
      }
    }, coachAnalysisDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [coachAnalysisDelayMs, coachAnalysisRequestKey, settings]);

  const canRequestAnalysisAtDelay =
    coachAnalysisDelayMs !== null &&
    canRequestCoachAnalysis({
      advantage: playPositionAnalysis.advantage,
      enabled: canAnalyzeCoachHints,
      isCpuThinking: game.isCpuThinking,
      players: game.players,
      session: game.session,
      settings,
      thinkingTimeMs: coachAnalysisDelayMs,
    });

  return {
    analysis: playPositionAnalysis,
    debugStatus: playPositionAnalysisResult.debug.status,
    canRequestAnalysisAtDelay,
    shouldRequestCoachAnalysis,
  };
}

function createCoachAnalysisRequestKey({
  canAnalyzeCoachHints,
  mode,
  session,
  settings,
}: {
  canAnalyzeCoachHints: boolean;
  mode: PlayCoachAnalysisMode;
  session: OthelloGameController["session"];
  settings: CoachHintSettings;
}): string {
  return [
    canAnalyzeCoachHints ? "coach-ready" : "coach-idle",
    mode,
    settings.mode,
    session.status,
    session.currentDisc,
    session.moveHistory.length,
    session.lastMove ?? "none",
    session.board.join(","),
  ].join("|");
}
