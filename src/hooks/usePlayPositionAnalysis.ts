import { useEffect, useMemo, useState } from "react";
import type { GameSession } from "../game/session";
import { analyzePlayPositionAsync } from "../services/playPositionAnalysisService";
import {
  createPlayPositionAnalysis,
  type CreatePlayPositionAnalysisOptions,
  type PlayPositionAnalysis,
} from "../teacher";

let nextPlayPositionAnalysisRequestId = 0;

export function usePlayPositionAnalysis(
  session: GameSession,
  options?: CreatePlayPositionAnalysisOptions,
): PlayPositionAnalysis {
  const optionsKey = useMemo(() => JSON.stringify(options ?? {}), [options]);
  const positionKey = useMemo(
    () => [session.currentDisc, session.board.join(","), optionsKey].join("|"),
    [optionsKey, session.board, session.currentDisc],
  );
  const [analysisState, setAnalysisState] = useState<{
    analysis: PlayPositionAnalysis;
    key: string;
  }>(() => ({
    analysis: createPlayPositionAnalysis(
      session.board,
      session.currentDisc,
      options,
    ),
    key: positionKey,
  }));

  useEffect(() => {
    let cancelled = false;
    const requestId = `play-position-${nextPlayPositionAnalysisRequestId}`;
    nextPlayPositionAnalysisRequestId += 1;

    void analyzePlayPositionAsync({
      board: session.board,
      currentDisc: session.currentDisc,
      options,
      requestId,
    }).then(
      (response) => {
        if (cancelled || response.requestId !== requestId) {
          return;
        }

        setAnalysisState({
          analysis: response.analysis,
          key: positionKey,
        });
      },
      () => {
        // Keep the previous analysis if both worker and fallback fail.
      },
    );

    return () => {
      cancelled = true;
    };
  }, [options, positionKey, session.board, session.currentDisc]);

  return analysisState.analysis;
}
