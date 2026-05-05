import { useEffect, useMemo, useState } from "react";
import type { GameSession } from "../game/session";
import { analyzePlayPositionAsync } from "../services/playPositionAnalysisService";
import {
  createPlayPositionAnalysisKey,
  createPlayPositionAnalysisState,
  getCurrentPlayPositionAnalysis,
  type PlayPositionAnalysisSources,
} from "../services/playPositionAnalysisState";
import {
  type CreatePlayPositionAnalysisOptions,
  type PlayPositionAnalysis,
} from "../teacher";

let nextPlayPositionAnalysisRequestId = 0;

export function usePlayPositionAnalysis(
  session: GameSession,
  options?: CreatePlayPositionAnalysisOptions,
): PlayPositionAnalysis {
  const sources = useMemo<PlayPositionAnalysisSources>(
    () => ({
      board: session.board,
      currentDisc: session.currentDisc,
      options,
    }),
    [options, session.board, session.currentDisc],
  );
  const positionKey = useMemo(
    () => createPlayPositionAnalysisKey(sources),
    [sources],
  );
  const [analysisState, setAnalysisState] = useState(() =>
    createPlayPositionAnalysisState(sources),
  );
  const currentAnalysis = getCurrentPlayPositionAnalysis(
    analysisState,
    sources,
  );

  useEffect(() => {
    let cancelled = false;
    const requestId = `play-position-${nextPlayPositionAnalysisRequestId}`;
    nextPlayPositionAnalysisRequestId += 1;

    void analyzePlayPositionAsync({
      board: sources.board,
      currentDisc: sources.currentDisc,
      options: sources.options,
      requestId,
    }).then(
      (response) => {
        if (cancelled || response.requestId !== requestId) {
          return;
        }

        setAnalysisState(
          createPlayPositionAnalysisState(sources, response.analysis),
        );
      },
      () => {
        // Keep the previous analysis if both worker and fallback fail.
      },
    );

    return () => {
      cancelled = true;
    };
  }, [positionKey, sources]);

  return currentAnalysis;
}
