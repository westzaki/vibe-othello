import { calculateAdvantage, countEmptySquares, type Advantage } from "../cpu";
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
export type PlayPositionConfidenceReason =
  | "finalBoard"
  | "exactEndgame"
  | "searchCandidates"
  | "noLegalMoves";
export type PlayPositionShapeSignalKind =
  | "cornerOpportunity"
  | "cornerRisk"
  | "mobilityOpportunity"
  | "mobilityRisk"
  | "endgame";
export type PlayPositionShapeSignalTone = "helpful" | "risk" | "neutral";
export type PlayPositionShapeSignalStrength = "low" | "medium" | "high";
export type PlayPositionShapeSignal = {
  candidate: CandidateMoveReview | null;
  kind: PlayPositionShapeSignalKind;
  square: SquareIndex | null;
  strength: PlayPositionShapeSignalStrength;
  tone: PlayPositionShapeSignalTone;
};

export type PlayPositionAnalysis = {
  advantage: Advantage;
  advantageSource: PlayPositionAdvantageSource;
  candidateMoves: CandidateMoveReview[];
  coachHints: CoachHint[];
  confidence: PlayPositionConfidence;
  confidenceReason: PlayPositionConfidenceReason;
  currentDisc: DiscColor;
  emptyCount: number;
  helpfulCandidates: CandidateMoveReview[];
  legalMoves: SquareIndex[];
  moveEvaluationSource: PlayPositionMoveEvaluationSource;
  phase: PlayPositionPhase;
  riskCandidates: CandidateMoveReview[];
  shapeSignals: PlayPositionShapeSignal[];
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
      confidenceReason: getConfidenceReason(advantageSource, "none"),
      currentDisc,
      emptyCount,
      helpfulCandidates: [],
      legalMoves,
      moveEvaluationSource: "none",
      phase,
      riskCandidates: [],
      shapeSignals: [],
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
  const shapeSignals = createShapeSignals({
    candidateMoves,
    evaluationSource: candidateAnalysis.evaluationSource,
  });

  return {
    advantage,
    advantageSource,
    candidateMoves,
    coachHints,
    confidence: getConfidence(advantageSource, moveEvaluationSource),
    confidenceReason: getConfidenceReason(
      advantageSource,
      moveEvaluationSource,
    ),
    currentDisc,
    emptyCount,
    helpfulCandidates,
    legalMoves,
    moveEvaluationSource,
    phase,
    riskCandidates,
    shapeSignals,
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

function getConfidenceReason(
  advantageSource: PlayPositionAdvantageSource,
  moveEvaluationSource: PlayPositionMoveEvaluationSource,
): PlayPositionConfidenceReason {
  if (advantageSource === "final") {
    return "finalBoard";
  }

  if (
    advantageSource === "exactEndgame" ||
    moveEvaluationSource === "exactEndgame"
  ) {
    return "exactEndgame";
  }

  return moveEvaluationSource === "none" ? "noLegalMoves" : "searchCandidates";
}

function createShapeSignals({
  candidateMoves,
  evaluationSource,
}: {
  candidateMoves: CandidateMoveReview[];
  evaluationSource: ReviewEvaluationSource;
}): PlayPositionShapeSignal[] {
  const signals: PlayPositionShapeSignal[] = [];
  const bestCandidate = candidateMoves[0] ?? null;

  if (evaluationSource === "exactEndgame") {
    return bestCandidate === null
      ? []
      : [
          {
            candidate: bestCandidate,
            kind: "endgame",
            square: bestCandidate.square,
            strength: "high",
            tone: "neutral",
          },
        ];
  }

  const cornerOpportunityCandidate = candidateMoves.find((candidate) =>
    candidate.reasons.includes("corner"),
  );

  if (cornerOpportunityCandidate !== undefined) {
    signals.push({
      candidate: cornerOpportunityCandidate,
      kind: "cornerOpportunity",
      square: cornerOpportunityCandidate.square,
      strength: "high",
      tone: "helpful",
    });
  }

  const cornerRiskCandidate = candidateMoves.find((candidate) =>
    candidate.reasons.includes("cornerGiven"),
  );

  if (cornerRiskCandidate !== undefined) {
    signals.push({
      candidate: cornerRiskCandidate,
      kind: "cornerRisk",
      square: cornerRiskCandidate.square,
      strength: "high",
      tone: "risk",
    });
  }

  const mobilityOpportunityCandidate = candidateMoves.find((candidate) =>
    candidate.reasons.includes("mobilityGain"),
  );

  if (mobilityOpportunityCandidate !== undefined) {
    signals.push({
      candidate: mobilityOpportunityCandidate,
      kind: "mobilityOpportunity",
      square: mobilityOpportunityCandidate.square,
      strength: getMobilitySignalStrength(
        mobilityOpportunityCandidate.metrics.mobilitySwing,
      ),
      tone: "helpful",
    });
  }

  const mobilityRiskCandidate = candidateMoves.find((candidate) =>
    candidate.reasons.includes("mobilityLoss"),
  );

  if (mobilityRiskCandidate !== undefined) {
    signals.push({
      candidate: mobilityRiskCandidate,
      kind: "mobilityRisk",
      square: mobilityRiskCandidate.square,
      strength: getMobilitySignalStrength(
        mobilityRiskCandidate.metrics.mobilitySwing,
      ),
      tone: "risk",
    });
  }

  const dangerSquareCandidate = candidateMoves.find((candidate) =>
    candidate.reasons.includes("dangerSquare"),
  );

  if (
    dangerSquareCandidate !== undefined &&
    !signals.some(
      (signal) =>
        signal.kind === "cornerRisk" ||
        signal.square === dangerSquareCandidate.square,
    )
  ) {
    signals.push({
      candidate: dangerSquareCandidate,
      kind: "cornerRisk",
      square: dangerSquareCandidate.square,
      strength: "medium",
      tone: "risk",
    });
  }

  return signals;
}

function getMobilitySignalStrength(
  mobilitySwing: number,
): PlayPositionShapeSignalStrength {
  const swingSize = Math.abs(mobilitySwing);

  if (swingSize >= 6) {
    return "high";
  }

  return swingSize >= 3 ? "medium" : "low";
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
