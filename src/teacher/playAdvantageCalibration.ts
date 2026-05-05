import type { Advantage } from "../cpu";
import type { DiscColor } from "../game/othello";
import type {
  PlayPositionAdvantageSource,
  PlayPositionPhase,
} from "./createPlayPositionAnalysis";
import type { CandidateMoveReview } from "./reviewTypes";

export type PlayAdvantageCalibrationContext = {
  advantage: Advantage;
  bestCandidate: CandidateMoveReview | null;
  candidateMoves: CandidateMoveReview[];
  currentDisc: DiscColor;
  phase: PlayPositionPhase;
  source: PlayPositionAdvantageSource;
};

const neutralPercent = 50;
const openingNeutralPull = 0.65;
const openingCornerNeutralPull = 0.25;
const midgameNeutralPull = 0.15;
const veryCloseCandidateGap = 6;
const closeCandidateGap = 14;
const veryCloseCandidateNeutralPull = 0.45;
const closeCandidateNeutralPull = 0.28;
const openingMinPercent = 45;
const openingMaxPercent = 55;
const openingCornerMaxPercent = 62;
const midgameMinPercent = 25;
const midgameMaxPercent = 75;
const cornerGivenPenalty = 8;
const cornerAccessPenalty = 5;
const dangerSquarePenalty = 3;
const mobilityRiskPenaltyWeight = 1.5;
const maxMobilityRiskPenalty = 6;

export function calibratePlayPositionAdvantage({
  advantage,
  bestCandidate,
  candidateMoves,
  currentDisc,
  phase,
  source,
}: PlayAdvantageCalibrationContext): Advantage {
  if (source !== "searchAdjusted") {
    return advantage;
  }

  const currentDiscPercent = getDiscPercent(advantage, currentDisc);
  const adjustedCurrentDiscPercent =
    currentDiscPercent + getCandidateRiskAdjustment(bestCandidate);
  const neutralPull = Math.max(
    getPhaseNeutralPull(phase, bestCandidate),
    getCandidateGapNeutralPull(candidateMoves),
  );
  const calibratedCurrentDiscPercent = capPercentByPhase(
    pullPercentTowardNeutral(adjustedCurrentDiscPercent, neutralPull),
    phase,
    bestCandidate,
  );
  const blackPercent =
    currentDisc === "black"
      ? calibratedCurrentDiscPercent
      : 100 - calibratedCurrentDiscPercent;
  const whitePercent = 100 - blackPercent;

  return {
    blackPercent,
    leadingDisc: getLeadingDisc(blackPercent, whitePercent),
    whitePercent,
  };
}

function getDiscPercent(advantage: Advantage, disc: DiscColor): number {
  return disc === "black" ? advantage.blackPercent : advantage.whitePercent;
}

function getCandidateRiskAdjustment(
  candidate: CandidateMoveReview | null,
): number {
  if (candidate === null) {
    return 0;
  }

  return (
    getCornerRiskAdjustment(candidate) +
    getDangerSquareAdjustment(candidate) +
    getMobilityRiskAdjustment(candidate)
  );
}

function getCornerRiskAdjustment(candidate: CandidateMoveReview): number {
  if (candidate.metrics.givesOpponentCorner) {
    return -cornerGivenPenalty;
  }

  return candidate.metrics.opponentCornerMoveDelta > 0
    ? -cornerAccessPenalty
    : 0;
}

function getDangerSquareAdjustment(candidate: CandidateMoveReview): number {
  return candidate.metrics.isDangerSquare ? -dangerSquarePenalty : 0;
}

function getMobilityRiskAdjustment(candidate: CandidateMoveReview): number {
  if (candidate.metrics.mobilitySwing >= 0) {
    return 0;
  }

  return Math.max(
    -maxMobilityRiskPenalty,
    candidate.metrics.mobilitySwing * mobilityRiskPenaltyWeight,
  );
}

function getPhaseNeutralPull(
  phase: PlayPositionPhase,
  candidate: CandidateMoveReview | null,
): number {
  if (phase === "opening") {
    return candidate?.metrics.isCorner === true
      ? openingCornerNeutralPull
      : openingNeutralPull;
  }

  if (phase === "midgame") {
    return midgameNeutralPull;
  }

  return 0;
}

function getCandidateGapNeutralPull(
  candidateMoves: CandidateMoveReview[],
): number {
  const secondCandidateGap = candidateMoves[1]?.metrics.scoreGapFromBest;

  if (secondCandidateGap === undefined) {
    return 0;
  }

  if (secondCandidateGap <= veryCloseCandidateGap) {
    return veryCloseCandidateNeutralPull;
  }

  if (secondCandidateGap <= closeCandidateGap) {
    return closeCandidateNeutralPull;
  }

  return 0;
}

function pullPercentTowardNeutral(percent: number, strength: number): number {
  return Math.round(percent * (1 - strength) + neutralPercent * strength);
}

function capPercentByPhase(
  percent: number,
  phase: PlayPositionPhase,
  candidate: CandidateMoveReview | null,
): number {
  if (phase === "opening") {
    return clampPercent(
      percent,
      openingMinPercent,
      candidate?.metrics.isCorner === true
        ? openingCornerMaxPercent
        : openingMaxPercent,
    );
  }

  if (phase === "midgame") {
    return clampPercent(percent, midgameMinPercent, midgameMaxPercent);
  }

  return clampPercent(percent, 0, 100);
}

function clampPercent(
  percent: number,
  minPercent: number,
  maxPercent: number,
): number {
  return Math.max(minPercent, Math.min(maxPercent, percent));
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
