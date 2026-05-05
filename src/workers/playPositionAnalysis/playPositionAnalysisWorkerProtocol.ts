import type { Board, DiscColor } from "../../game/othello";
import type {
  CreatePlayPositionAnalysisOptions,
  PlayPositionAnalysis,
} from "../../teacher";

export type PlayPositionAnalysisWorkerRequest = {
  board: Board;
  currentDisc: DiscColor;
  options?: CreatePlayPositionAnalysisOptions;
  requestId: number;
  type: "analyzePlayPosition";
};

export type PlayPositionAnalysisWorkerResponse =
  | {
      analysis: PlayPositionAnalysis;
      requestId: number;
      type: "playPositionAnalyzed";
    }
  | {
      message: string;
      requestId: number;
      type: "playPositionAnalysisError";
    };
