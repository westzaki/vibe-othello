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
  type CreateCoachHintsFromAnalysisOptions,
} from "./createCoachHint";
import type {
  CandidateMoveReview,
  ReviewEvaluationSource,
} from "./reviewTypes";
import { createShapeSignals } from "./playPositionShapeSignals";
import { selectTeacherGuidanceCandidate } from "./teacherGuidanceMove";
import type { TeacherGuidanceOptions } from "./coachHintTypes";

export type PlayPositionPhase = "opening" | "midgame" | "endgame";
export type PlayPositionAdvantageSource =
  | "heuristic"
  | "searchAdjusted"
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
  | "stableEdge"
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
    includeBestMoveHint?: CreateCoachHintsFromAnalysisOptions["includeBestMoveHint"];
    includeCandidateFallback?: boolean;
    messageStyle?: CoachHintMessageStyle;
    riskHintLimit?: CreateCoachHintsFromAnalysisOptions["riskHintLimit"];
    skipMoveAnalysis?: boolean;
  } & TeacherGuidanceOptions;

const defaultPlayPositionSearchDepth = 3;
const exactEndgameEmptyThreshold = 10;
const openingEmptyThreshold = 44;
const searchOutlookScale = 260;
const openingSearchBlend = 0.3;
const midgameSearchBlend = 0.45;
const mobilityPercentWeight = 2;
const cornerOpportunityPercentBonus = 10;
const cornerRiskPercentPenalty = 14;

export function createPlayPositionAnalysis(
  board: Board,
  currentDisc: DiscColor,
  {
    includeBestMoveHint = false,
    includeCandidateFallback = true,
    guidanceMode,
    messageStyle = "specific",
    riskHintLimit,
    searchDepth = defaultPlayPositionSearchDepth,
    deepSearchDepth,
    refutationSearchDepth,
    strongCandidateScoreGap,
    topCandidateLimit,
    skipMoveAnalysis = false,
    useTeacherGuidanceMove = false,
    useSelectiveDeepening,
  }: CreatePlayPositionAnalysisOptions = {},
): PlayPositionAnalysis {
  const emptyCount = countEmptySquares(board);
  const phase = getPlayPositionPhase(emptyCount);
  const legalMoves = getLegalMoves(board, currentDisc);
  const baseAdvantage = calculateAdvantage(board, currentDisc);
  const baseAdvantageSource = getAdvantageSource(board, emptyCount);

  if (legalMoves.length === 0 || skipMoveAnalysis) {
    return createBasePlayPositionAnalysis({
      advantage: baseAdvantage,
      advantageSource: baseAdvantageSource,
      currentDisc,
      emptyCount,
      legalMoves,
      phase,
    });
  }

  const candidateAnalysis = analyzeMoveCandidates(board, currentDisc, {
    searchDepth,
    useSelectiveDeepening,
  });
  const moveEvaluationSource = getMoveEvaluationSource(
    candidateAnalysis.evaluationSource,
  );
  const candidateMoves = candidateAnalysis.candidateMoves;
  const teacherGuidanceCandidate = useTeacherGuidanceMove
    ? selectTeacherGuidanceCandidate({
        analysis: candidateAnalysis,
        board,
        deepSearchDepth,
        disc: currentDisc,
        guidanceMode,
        isDisadvantaged: getAdvantagePercent(baseAdvantage, currentDisc) < 45,
        refutationSearchDepth,
        strongCandidateScoreGap,
        topCandidateLimit,
      })
    : null;
  const advantageSource = getPlayAdvantageSource(
    baseAdvantageSource,
    moveEvaluationSource,
  );
  const advantage = getPlayPositionAdvantage({
    baseAdvantage,
    bestCandidate: teacherGuidanceCandidate ?? candidateMoves[0] ?? null,
    currentDisc,
    phase,
    source: advantageSource,
  });
  const riskCandidates = candidateMoves.filter(hasRiskReason);
  const helpfulCandidates = candidateMoves.filter((candidate) =>
    hasHelpfulReason(candidate, candidateAnalysis.evaluationSource),
  );
  const bestMoveSquare =
    includeBestMoveHint && teacherGuidanceCandidate !== null
      ? teacherGuidanceCandidate.square
      : null;
  const coachHints = createCoachHintsFromAnalysis(candidateAnalysis, {
    bestMoveSquare,
    includeBestMoveHint,
    includeCandidateFallback,
    messageStyle,
    riskHintLimit,
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

function createBasePlayPositionAnalysis({
  advantage,
  advantageSource,
  currentDisc,
  emptyCount,
  legalMoves,
  phase,
}: {
  advantage: Advantage;
  advantageSource: PlayPositionAdvantageSource;
  currentDisc: DiscColor;
  emptyCount: number;
  legalMoves: SquareIndex[];
  phase: PlayPositionPhase;
}): PlayPositionAnalysis {
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

function getPlayAdvantageSource(
  baseAdvantageSource: PlayPositionAdvantageSource,
  moveEvaluationSource: PlayPositionMoveEvaluationSource,
): PlayPositionAdvantageSource {
  if (
    baseAdvantageSource === "final" ||
    baseAdvantageSource === "exactEndgame" ||
    moveEvaluationSource === "exactEndgame" ||
    moveEvaluationSource === "none"
  ) {
    return baseAdvantageSource;
  }

  return "searchAdjusted";
}

function getPlayPositionAdvantage({
  baseAdvantage,
  bestCandidate,
  currentDisc,
  phase,
  source,
}: {
  baseAdvantage: Advantage;
  bestCandidate: CandidateMoveReview | null;
  currentDisc: DiscColor;
  phase: PlayPositionPhase;
  source: PlayPositionAdvantageSource;
}): Advantage {
  if (source !== "searchAdjusted") {
    return baseAdvantage;
  }

  if (bestCandidate === null) {
    return baseAdvantage;
  }

  const searchBlend = getSearchBlend(phase);
  const outlookBlackPercent = getCandidateOutlookBlackPercent(
    bestCandidate,
    currentDisc,
  );
  const blackPercent = clampPercent(
    Math.round(
      baseAdvantage.blackPercent * (1 - searchBlend) +
        outlookBlackPercent * searchBlend,
    ),
  );
  const whitePercent = 100 - blackPercent;

  return {
    blackPercent,
    leadingDisc: getLeadingDisc(blackPercent, whitePercent),
    whitePercent,
  };
}

function getSearchBlend(phase: PlayPositionPhase): number {
  if (phase === "opening") {
    return openingSearchBlend;
  }

  if (phase === "midgame") {
    return midgameSearchBlend;
  }

  return 0;
}

function getCandidateOutlookBlackPercent(
  candidate: CandidateMoveReview,
  currentDisc: DiscColor,
): number {
  const currentDiscPercent = clampPercent(
    scoreToPercent(candidate.score, searchOutlookScale) +
      getCandidateMetricPercentAdjustment(candidate),
  );

  return currentDisc === "black"
    ? currentDiscPercent
    : 100 - currentDiscPercent;
}

function getCandidateMetricPercentAdjustment(
  candidate: CandidateMoveReview,
): number {
  const mobilityAdjustment =
    candidate.metrics.mobilitySwing * mobilityPercentWeight;
  const cornerAdjustment = candidate.metrics.isCorner
    ? cornerOpportunityPercentBonus
    : 0;
  const cornerRiskAdjustment = candidate.metrics.givesOpponentCorner
    ? -cornerRiskPercentPenalty
    : 0;

  return mobilityAdjustment + cornerAdjustment + cornerRiskAdjustment;
}

function getAdvantagePercent(
  advantage: Advantage,
  disc: DiscColor,
): number {
  return disc === "black" ? advantage.blackPercent : advantage.whitePercent;
}

function scoreToPercent(score: number, scale: number): number {
  return Math.round(50 + Math.tanh(score / scale) * 50);
}

function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

function getLeadingDisc(
  blackPercent: number,
  whitePercent: number,
): DiscColor | null {
  if (blackPercent === whitePercent) {
    return null;
  }

  return blackPercent > whitePercent ? "black" : "white";
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
      ["corner", "mobilityGain", "stablePosition"].includes(reason),
    ) ||
    (evaluationSource === "exactEndgame" && candidate.rank === 1)
  );
}
