import type { MoveCandidateAnalysis } from "./analyzeMoveCandidates";
import type { SquareIndex } from "../game/othello";
import type { CandidateMoveReview } from "./reviewTypes";
import type { CoachHintDraft, CoachHintSeverity } from "./coachHintTypes";

export type CoachHintPolicyOptions = {
  bestMoveSquare?: SquareIndex | null;
  includeBestMoveHint: boolean;
  includeCandidateFallback: boolean;
  riskHintLimit?: number;
};

const actionableRiskScoreGap = 5;
const actionableHelpfulScoreGap = 35;
const defaultRiskHintLimit = 3;
const highRiskScoreGap = 45;
const mediumRiskScoreGap = 18;
const highRiskMobilitySwing = -6;
const mediumRiskMobilitySwing = -3;
const riskSeverityPriority: Record<CoachHintSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function selectCoachHintDrafts(
  analysis: MoveCandidateAnalysis,
  {
    bestMoveSquare,
    includeBestMoveHint,
    includeCandidateFallback,
    riskHintLimit = defaultRiskHintLimit,
  }: CoachHintPolicyOptions,
): CoachHintDraft[] {
  const bestCandidate = analysis.candidateMoves[0] ?? null;

  if (bestCandidate === null) {
    return [];
  }

  const drafts: CoachHintDraft[] = [];

  if (includeBestMoveHint) {
    const bestMoveCandidate = findCandidateBySquare(
      analysis.candidateMoves,
      bestMoveSquare,
    );

    drafts.push({
      candidate: bestMoveCandidate ?? bestCandidate,
      kind: "bestMove",
      severity: "medium",
    });
  }

  if (analysis.evaluationSource !== "exactEndgame") {
    for (const riskDraft of selectRiskDrafts(analysis).slice(
      0,
      Math.max(0, riskHintLimit),
    )) {
      if (drafts.some((draft) => hasSameSquare(draft, riskDraft))) {
        continue;
      }

      drafts.push(riskDraft);
    }
  }

  const helpfulCandidate = findHelpfulCandidate(analysis, {
    includeCandidateFallback,
  });
  const helpfulDraft =
    helpfulCandidate === null
      ? null
      : createHelpfulDraft({
          candidate: helpfulCandidate,
          evaluationSource: analysis.evaluationSource,
          includeCandidateFallback,
        });

  if (
    helpfulDraft !== null &&
    !drafts.some((draft) => hasSameSquare(draft, helpfulDraft))
  ) {
    drafts.push(helpfulDraft);
  }

  return drafts;
}

function findCandidateBySquare(
  candidateMoves: CandidateMoveReview[],
  square: SquareIndex | null | undefined,
): CandidateMoveReview | null {
  if (square === null || square === undefined) {
    return null;
  }

  return candidateMoves.find((candidate) => candidate.square === square) ?? null;
}

function hasSameSquare(firstDraft: CoachHintDraft, secondDraft: CoachHintDraft) {
  return firstDraft.candidate.square === secondDraft.candidate.square;
}

function findHelpfulCandidate(
  analysis: MoveCandidateAnalysis,
  {
    includeCandidateFallback,
  }: {
    includeCandidateFallback: boolean;
  },
): CandidateMoveReview | null {
  const bestCandidate = analysis.candidateMoves[0] ?? null;

  if (bestCandidate === null) {
    return null;
  }

  if (analysis.evaluationSource === "exactEndgame") {
    return bestCandidate;
  }

  const cornerCandidate = analysis.candidateMoves.find((candidate) =>
    candidate.reasons.includes("corner"),
  );

  if (cornerCandidate !== undefined) {
    return cornerCandidate;
  }

  const stableEdgeCandidate = analysis.candidateMoves.find((candidate) =>
    candidate.reasons.includes("stablePosition"),
  );

  if (stableEdgeCandidate !== undefined) {
    return stableEdgeCandidate;
  }

  const mobilityCandidate = analysis.candidateMoves.find(
    (candidate) =>
      candidate.reasons.includes("mobilityGain") &&
      candidate.metrics.scoreGapFromBest <= actionableHelpfulScoreGap,
  );

  if (mobilityCandidate !== undefined) {
    return mobilityCandidate;
  }

  return includeCandidateFallback ? bestCandidate : null;
}

function selectRiskDrafts(analysis: MoveCandidateAnalysis): CoachHintDraft[] {
  const riskDrafts: CoachHintDraft[] = [];

  for (const candidate of analysis.candidateMoves) {
    const kind = getRiskHintKind(candidate);

    if (kind === null) {
      continue;
    }

    if (
      riskDrafts.some((draft) => draft.candidate.square === candidate.square)
    ) {
      continue;
    }

    riskDrafts.push({
      candidate,
      kind,
      severity: getRiskSeverity(candidate),
    });
  }

  return riskDrafts.sort(compareRiskDrafts);
}

function getRiskHintKind(
  candidate: CandidateMoveReview,
): CoachHintDraft["kind"] | null {
  if (candidate.reasons.includes("cornerGiven")) {
    return "cornerRisk";
  }

  if (
    candidate.reasons.includes("mobilityLoss") &&
    candidate.metrics.scoreGapFromBest >= actionableRiskScoreGap
  ) {
    return "mobilityRisk";
  }

  if (
    candidate.reasons.includes("dangerSquare") &&
    candidate.metrics.scoreGapFromBest >= actionableRiskScoreGap
  ) {
    return "cornerRisk";
  }

  return null;
}

function getRiskSeverity(candidate: CandidateMoveReview): CoachHintSeverity {
  if (
    candidate.reasons.includes("cornerGiven") ||
    candidate.metrics.scoreGapFromBest >= highRiskScoreGap ||
    candidate.metrics.mobilitySwing <= highRiskMobilitySwing
  ) {
    return "high";
  }

  if (
    candidate.metrics.scoreGapFromBest >= mediumRiskScoreGap ||
    candidate.metrics.mobilitySwing <= mediumRiskMobilitySwing
  ) {
    return "medium";
  }

  return "low";
}

function compareRiskDrafts(
  firstDraft: CoachHintDraft,
  secondDraft: CoachHintDraft,
): number {
  const severityDifference =
    riskSeverityPriority[secondDraft.severity] -
    riskSeverityPriority[firstDraft.severity];

  if (severityDifference !== 0) {
    return severityDifference;
  }

  const scoreGapDifference =
    secondDraft.candidate.metrics.scoreGapFromBest -
    firstDraft.candidate.metrics.scoreGapFromBest;

  if (scoreGapDifference !== 0) {
    return scoreGapDifference;
  }

  return firstDraft.candidate.rank - secondDraft.candidate.rank;
}

function createHelpfulDraft({
  candidate,
  evaluationSource,
  includeCandidateFallback,
}: {
  candidate: CandidateMoveReview;
  evaluationSource: "exactEndgame" | "minimax";
  includeCandidateFallback: boolean;
}): CoachHintDraft | null {
  if (evaluationSource === "exactEndgame") {
    return {
      candidate,
      kind: "endgame",
      severity: "medium",
    };
  }

  if (candidate.reasons.includes("corner")) {
    return {
      candidate,
      kind: "cornerOpportunity",
      severity: "medium",
    };
  }

  if (candidate.reasons.includes("stablePosition")) {
    return {
      candidate,
      kind: "stableEdge",
      severity: "medium",
    };
  }

  if (candidate.reasons.includes("mobilityGain")) {
    return {
      candidate,
      kind: "mobility",
      severity: "medium",
    };
  }

  if (includeCandidateFallback) {
    return {
      candidate,
      kind: "candidate",
      severity: "medium",
    };
  }

  return null;
}
