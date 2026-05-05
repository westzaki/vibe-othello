import {
  calculateAdvantage,
  countEmptySquares,
  type Advantage,
} from "../cpu";
import {
  getLegalMoves,
  isGameOver,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import {
  analyzeMoveCandidates,
  type AnalyzeMoveCandidatesOptions,
} from "./analyzeMoveCandidates";
import {
  createCoachHintsFromAnalysis,
  type CoachHint,
  type CoachHintMessageStyle,
} from "./createCoachHint";
import type {
  CandidateMoveReview,
  ReviewEvaluationSource,
} from "./reviewTypes";

export type PlayPositionPhase = "opening" | "midgame" | "endgame";
export type PlayPositionAdvantageSource =
  | "heuristic"
  | "exactEndgame"
  | "final";
export type PlayPositionMoveEvaluationSource =
  | "search"
  | "exactEndgame"
  | "none";
export type PlayPositionConfidence = "low" | "medium" | "high";

export type PlayPositionAnalysis = {
  advantage: Advantage;
  advantageSource: PlayPositionAdvantageSource;
  candidateMoves: CandidateMoveReview[];
  coachHints: CoachHint[];
  confidence: PlayPositionConfidence;
  currentDisc: DiscColor;
  emptyCount: number;
  helpfulCandidates: CandidateMoveReview[];
  legalMoves: SquareIndex[];
  moveEvaluationSource: PlayPositionMoveEvaluationSource;
  phase: PlayPositionPhase;
  riskCandidates: CandidateMoveReview[];
};

export type CreatePlayPositionAnalysisOptions =
  Partial<AnalyzeMoveCandidatesOptions> & {
    includeCandidateFallback?: boolean;
    messageStyle?: CoachHintMessageStyle;
  };

const defaultPlayPositionSearchDepth = 3;
const exactEndgameEmptyThreshold = 10;
const openingEmptyThreshold = 44;

export function createPlayPositionAnalysis(
  board: Board,
  currentDisc: DiscColor,
  {
    includeCandidateFallback = true,
    messageStyle = "specific",
    searchDepth = defaultPlayPositionSearchDepth,
  }: CreatePlayPositionAnalysisOptions = {},
): PlayPositionAnalysis {
  const emptyCount = countEmptySquares(board);
  const phase = getPlayPositionPhase(emptyCount);
  const legalMoves = getLegalMoves(board, currentDisc);
  const advantage = calculateAdvantage(board, currentDisc);
  const advantageSource = getAdvantageSource(board, emptyCount);

  if (legalMoves.length === 0) {
    return {
      advantage,
      advantageSource,
      candidateMoves: [],
      coachHints: [],
      confidence: getConfidence(advantageSource, "none"),
      currentDisc,
      emptyCount,
      helpfulCandidates: [],
      legalMoves,
      moveEvaluationSource: "none",
      phase,
      riskCandidates: [],
    };
  }

  const candidateAnalysis = analyzeMoveCandidates(board, currentDisc, {
    searchDepth,
  });
  const moveEvaluationSource = getMoveEvaluationSource(
    candidateAnalysis.evaluationSource,
  );
  const candidateMoves = candidateAnalysis.candidateMoves;
  const riskCandidates = candidateMoves.filter(hasRiskReason);
  const helpfulCandidates = candidateMoves.filter((candidate) =>
    hasHelpfulReason(candidate, candidateAnalysis.evaluationSource),
  );
  const coachHints = createCoachHintsFromAnalysis(candidateAnalysis, {
    includeCandidateFallback,
    messageStyle,
  });

  return {
    advantage,
    advantageSource,
    candidateMoves,
    coachHints,
    confidence: getConfidence(advantageSource, moveEvaluationSource),
    currentDisc,
    emptyCount,
    helpfulCandidates,
    legalMoves,
    moveEvaluationSource,
    phase,
    riskCandidates,
  };
}

function getPlayPositionPhase(emptyCount: number): PlayPositionPhase {
  if (emptyCount <= exactEndgameEmptyThreshold) {
    return "endgame";
  }

  if (emptyCount >= openingEmptyThreshold) {
    return "opening";
  }

  return "midgame";
}

function getAdvantageSource(
  board: Board,
  emptyCount: number,
): PlayPositionAdvantageSource {
  if (isGameOver(board)) {
    return "final";
  }

  return emptyCount <= exactEndgameEmptyThreshold
    ? "exactEndgame"
    : "heuristic";
}

function getMoveEvaluationSource(
  evaluationSource: ReviewEvaluationSource,
): PlayPositionMoveEvaluationSource {
  return evaluationSource === "exactEndgame" ? "exactEndgame" : "search";
}

function getConfidence(
  advantageSource: PlayPositionAdvantageSource,
  moveEvaluationSource: PlayPositionMoveEvaluationSource,
): PlayPositionConfidence {
  if (
    advantageSource === "final" ||
    advantageSource === "exactEndgame" ||
    moveEvaluationSource === "exactEndgame"
  ) {
    return "high";
  }

  return moveEvaluationSource === "none" ? "low" : "medium";
}

function hasRiskReason(candidate: CandidateMoveReview): boolean {
  return candidate.reasons.some((reason) =>
    ["cornerGiven", "dangerSquare", "mobilityLoss"].includes(reason),
  );
}

function hasHelpfulReason(
  candidate: CandidateMoveReview,
  evaluationSource: ReviewEvaluationSource,
): boolean {
  return (
    candidate.reasons.some((reason) =>
      ["corner", "mobilityGain"].includes(reason),
    ) ||
    (evaluationSource === "exactEndgame" && candidate.rank === 1)
  );
}
