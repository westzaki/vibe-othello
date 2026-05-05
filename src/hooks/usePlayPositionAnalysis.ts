import { useEffect, useMemo, useState } from "react";
import type { GameSession } from "../game/session";
import {
  analyzePlayPositionAsync,
  type PlayPositionAnalysisResponseSource,
} from "../services/playPositionAnalysisService";
import {
  createPlayPositionAnalysisKey,
  createPlayPositionAnalysisState,
  createSynchronousPlayPositionAnalysis,
  getCurrentPlayPositionAnalysis,
  shouldUseSynchronousPlayPositionAnalysis,
  type PlayPositionAnalysisSources,
} from "../services/playPositionAnalysisState";
import {
  type CreatePlayPositionAnalysisOptions,
  type PlayPositionAnalysis,
} from "../teacher";

let nextPlayPositionAnalysisRequestId = 0;

export type PlayPositionAnalysisDebugStatus =
  | "error"
  | "fallback"
  | "loading"
  | "ready"
  | "sync";

export type PlayPositionAnalysisDebugState = {
  requestId: string | null;
  status: PlayPositionAnalysisDebugStatus;
};

type StoredPlayPositionAnalysisDebugState = PlayPositionAnalysisDebugState & {
  key: string;
};

export type PlayPositionAnalysisResult = {
  analysis: PlayPositionAnalysis;
  debug: PlayPositionAnalysisDebugState;
};

export function usePlayPositionAnalysis(
  session: GameSession,
  options?: CreatePlayPositionAnalysisOptions,
): PlayPositionAnalysis {
  return usePlayPositionAnalysisResult(session, options).analysis;
}

export function usePlayPositionAnalysisResult(
  session: GameSession,
  options?: CreatePlayPositionAnalysisOptions,
): PlayPositionAnalysisResult {
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
  const [debugState, setDebugState] =
    useState<StoredPlayPositionAnalysisDebugState>(() =>
      createDebugState(positionKey, getInitialDebugStatus(sources.options)),
    );
  const synchronousAnalysis = useMemo(
    () => createSynchronousPlayPositionAnalysis(sources),
    [sources],
  );
  const shouldUseSynchronousAnalysis = shouldUseSynchronousPlayPositionAnalysis(
    sources.options,
  );
  const currentAnalysis = getCurrentPlayPositionAnalysis(
    analysisState,
    sources,
  );

  useEffect(() => {
    if (shouldUseSynchronousAnalysis) {
      return;
    }

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
        setDebugState(
          createDebugState(
            positionKey,
            getDebugStatusFromResponseSource(response.source),
            requestId,
          ),
        );
      },
      () => {
        // Keep the previous analysis if both worker and fallback fail.
        if (!cancelled) {
          setDebugState(createDebugState(positionKey, "error", requestId));
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [positionKey, shouldUseSynchronousAnalysis, sources]);

  return {
    analysis: shouldUseSynchronousAnalysis ? synchronousAnalysis : currentAnalysis,
    debug:
      debugState.key === positionKey
        ? {
            requestId: debugState.requestId,
            status: debugState.status,
          }
        : createDebugState(positionKey, getInitialDebugStatus(sources.options)),
  };
}

function createDebugState(
  key: string,
  status: PlayPositionAnalysisDebugStatus,
  requestId: string | null = null,
): StoredPlayPositionAnalysisDebugState {
  return {
    key,
    requestId,
    status,
  };
}

function getInitialDebugStatus(
  options: CreatePlayPositionAnalysisOptions | undefined,
): PlayPositionAnalysisDebugStatus {
  return shouldUseSynchronousPlayPositionAnalysis(options) ? "sync" : "loading";
}

function getDebugStatusFromResponseSource(
  source: PlayPositionAnalysisResponseSource,
): PlayPositionAnalysisDebugStatus {
  return source === "fallback" ? "fallback" : "ready";
}
