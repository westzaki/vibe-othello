import type {
  PlayPositionShapeSignal,
  PlayPositionShapeSignalStrength,
} from "./createPlayPositionAnalysis";
import type {
  CandidateMoveReview,
  ReviewEvaluationSource,
} from "./reviewTypes";

export function createShapeSignals({
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
