import { strategicEvaluateBoard } from "../cpu";
import type { DiscColor } from "../game/othello";
import type { MoveRecord } from "../game/session";
import type {
  EvaluationTimelineEntry,
  TurningPointAnalysisConfig,
} from "./reviewTypes";

export const defaultTurningPointAnalysisConfig: TurningPointAnalysisConfig = {
  dropThreshold: 30,
  lookaheadMoves: 4,
  recoveryMargin: 10,
};

export function createEvaluationTimeline(
  moveHistory: MoveRecord[],
  reviewedDisc: DiscColor,
): EvaluationTimelineEntry[] {
  return moveHistory.map((move) => {
    const scoreBefore = strategicEvaluateBoard(move.boardBefore, reviewedDisc);
    const scoreAfter = strategicEvaluateBoard(move.boardAfter, reviewedDisc);

    return {
      delta: scoreAfter - scoreBefore,
      disc: move.disc,
      moveNumber: move.moveNumber,
      scoreAfter,
      scoreBefore,
      square: move.square,
    };
  });
}

export function findTurningPointMoveNumbers(
  timeline: EvaluationTimelineEntry[],
  reviewedDisc: DiscColor,
  config: Partial<TurningPointAnalysisConfig> = {},
): number[] {
  const resolvedConfig = {
    ...defaultTurningPointAnalysisConfig,
    ...config,
  };

  return timeline
    .filter((entry, index) =>
      isTurningPointCandidate(
        entry,
        index,
        timeline,
        reviewedDisc,
        resolvedConfig,
      ),
    )
    .map((entry) => entry.moveNumber);
}

function isTurningPointCandidate(
  entry: EvaluationTimelineEntry,
  index: number,
  timeline: EvaluationTimelineEntry[],
  reviewedDisc: DiscColor,
  config: TurningPointAnalysisConfig,
): boolean {
  if (entry.disc !== reviewedDisc) {
    return false;
  }

  if (entry.delta > -config.dropThreshold) {
    return false;
  }

  const recoveryScore = entry.scoreBefore - config.recoveryMargin;
  const lookaheadEntries = timeline.slice(
    index + 1,
    index + 1 + config.lookaheadMoves,
  );

  return !lookaheadEntries.some(
    (lookaheadEntry) => lookaheadEntry.scoreAfter >= recoveryScore,
  );
}
