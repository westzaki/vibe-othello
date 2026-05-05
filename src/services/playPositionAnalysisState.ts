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
  analysis = createPlayPositionAnalysis(
    sources.board,
    sources.currentDisc,
    sources.options,
  ),
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

  return createPlayPositionAnalysis(
    sources.board,
    sources.currentDisc,
    sources.options,
  );
}
