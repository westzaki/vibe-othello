import type { Board, DiscColor } from "../game/othello";
import {
  createPlayPositionAnalysis,
  type CreatePlayPositionAnalysisOptions,
  type PlayPositionAnalysis,
} from "../teacher";

export type PlayPositionAnalysisSources = {
  board: Board;
  currentDisc: DiscColor;
  options?: CreatePlayPositionAnalysisOptions;
};

export type StoredPlayPositionAnalysisState = {
  analysis: PlayPositionAnalysis;
  key: string;
};

export function createPlayPositionAnalysisKey({
  board,
  currentDisc,
  options,
}: PlayPositionAnalysisSources): string {
  return [
    currentDisc,
    board.join(","),
    JSON.stringify(options ?? {}),
  ].join("|");
}

export function createPlayPositionAnalysisState(
  sources: PlayPositionAnalysisSources,
  analysis = createSynchronousPlayPositionAnalysis(sources),
): StoredPlayPositionAnalysisState {
  return {
    analysis,
    key: createPlayPositionAnalysisKey(sources),
  };
}

export function getCurrentPlayPositionAnalysis(
  analysisState: StoredPlayPositionAnalysisState,
  sources: PlayPositionAnalysisSources,
): PlayPositionAnalysis {
  if (analysisState.key === createPlayPositionAnalysisKey(sources)) {
    return analysisState.analysis;
  }

  return createSynchronousPlayPositionAnalysis(sources);
}

function createSynchronousPlayPositionAnalysis({
  board,
  currentDisc,
  options,
}: PlayPositionAnalysisSources): PlayPositionAnalysis {
  return createPlayPositionAnalysis(
    board,
    currentDisc,
    createSynchronousPlayPositionAnalysisOptions(options),
  );
}

function createSynchronousPlayPositionAnalysisOptions(
  options: CreatePlayPositionAnalysisOptions | undefined,
): CreatePlayPositionAnalysisOptions | undefined {
  if (!options?.useTeacherGuidanceMove) {
    return options;
  }

  return {
    ...options,
    includeBestMoveHint: false,
    useTeacherGuidanceMove: false,
  };
}
