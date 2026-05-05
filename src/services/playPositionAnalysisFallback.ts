import type { Board, DiscColor } from "../game/othello";
import {
  createPlayPositionAnalysis,
  type CreatePlayPositionAnalysisOptions,
  type PlayPositionAnalysis,
} from "../teacher";

export function createLightweightPlayPositionAnalysis(
  board: Board,
  currentDisc: DiscColor,
  options: CreatePlayPositionAnalysisOptions | undefined,
): PlayPositionAnalysis {
  return createPlayPositionAnalysis(
    board,
    currentDisc,
    createLightweightPlayPositionAnalysisOptions(options),
  );
}

export function createLightweightPlayPositionAnalysisOptions(
  options: CreatePlayPositionAnalysisOptions | undefined,
): CreatePlayPositionAnalysisOptions | undefined {
  return {
    ...options,
    includeBestMoveHint: false,
    skipMoveAnalysis: true,
    useTeacherGuidanceMove: false,
  };
}
