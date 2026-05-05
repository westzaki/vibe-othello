import type { MoveCandidateAnalysis } from "./analyzeMoveCandidates";
import type { CandidateMoveReview } from "./reviewTypes";
import type { CoachHintDraft } from "./coachHintTypes";

export type CoachHintPolicyOptions = {
  includeCandidateFallback: boolean;
};

const actionableRiskScoreGap = 5;
const actionableHelpfulScoreGap = 35;

export function selectCoachHintDrafts(
  analysis: MoveCandidateAnalysis,
  { includeCandidateFallback }: CoachHintPolicyOptions,
): CoachHintDraft[] {
  const bestCandidate = analysis.candidateMoves[0] ?? null;

  if (bestCandidate === null) {
    return [];
  }

  const drafts: CoachHintDraft[] = [];

  const shouldShowShapeRisk = analysis.evaluationSource !== "exactEndgame";
  const cornerGivenRiskCandidate = shouldShowShapeRisk
    ? findRiskCandidate(analysis, (candidate) =>
        candidate.reasons.includes("cornerGiven"),
      )
    : undefined;

  if (cornerGivenRiskCandidate !== undefined) {
    drafts.push({
      candidate: cornerGivenRiskCandidate,
      kind: "cornerRisk",
    });
  }

  const mobilityRiskCandidate =
    shouldShowShapeRisk && cornerGivenRiskCandidate === undefined
      ? findRiskCandidate(analysis, (candidate) =>
          candidate.reasons.includes("mobilityLoss"),
        )
      : undefined;

  if (
    mobilityRiskCandidate !== undefined &&
    !drafts.some(
      (draft) => draft.candidate.square === mobilityRiskCandidate.square,
    )
  ) {
    drafts.push({
      candidate: mobilityRiskCandidate,
      kind: "mobilityRisk",
    });
  }

  const dangerSquareRiskCandidate =
    shouldShowShapeRisk &&
    cornerGivenRiskCandidate === undefined &&
    mobilityRiskCandidate === undefined
      ? findRiskCandidate(analysis, (candidate) =>
          candidate.reasons.includes("dangerSquare"),
        )
      : undefined;

  if (dangerSquareRiskCandidate !== undefined) {
    drafts.push({
      candidate: dangerSquareRiskCandidate,
      kind: "cornerRisk",
    });
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
    !drafts.some(
      (draft) => draft.candidate.square === helpfulDraft.candidate.square,
    )
  ) {
    drafts.push(helpfulDraft);
  }

  return drafts;
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

function findRiskCandidate(
  analysis: MoveCandidateAnalysis,
  predicate: (candidate: CandidateMoveReview) => boolean,
): CandidateMoveReview | undefined {
  const bestCandidate = analysis.candidateMoves[0] ?? null;

  if (bestCandidate === null) {
    return undefined;
  }

  return analysis.candidateMoves.find((candidate) => {
    if (!predicate(candidate)) {
      return false;
    }

    if (candidate.reasons.includes("cornerGiven")) {
      return true;
    }

    return candidate.metrics.scoreGapFromBest >= actionableRiskScoreGap;
  });
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
  if (candidate.reasons.includes("corner")) {
    return {
      candidate,
      kind: "cornerOpportunity",
    };
  }

  if (candidate.reasons.includes("mobilityGain")) {
    return {
      candidate,
      kind: "mobility",
    };
  }

  if (evaluationSource === "exactEndgame") {
    return {
      candidate,
      kind: "endgame",
    };
  }

  if (includeCandidateFallback) {
    return {
      candidate,
      kind: "candidate",
    };
  }

  return null;
}
