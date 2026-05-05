import type { Board, DiscColor } from "../game/othello";
import type {
  CreatePlayPositionAnalysisOptions,
  PlayPositionAnalysis,
} from "../teacher";
import { createLightweightPlayPositionAnalysis } from "./playPositionAnalysisFallback";

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
  return createLightweightPlayPositionAnalysis(board, currentDisc, options);
}
