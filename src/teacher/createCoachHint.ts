import type { Board, DiscColor, SquareIndex } from "../game/othello";
import {
  analyzeMoveCandidates,
  type AnalyzeMoveCandidatesOptions,
  type MoveCandidateAnalysis,
} from "./analyzeMoveCandidates";
import type { CandidateMoveReview, MoveReviewReason } from "./reviewTypes";

export type CoachHintKind =
  | "cornerOpportunity"
  | "cornerRisk"
  | "mobilityRisk"
  | "mobility"
  | "endgame"
  | "candidate";

export type CoachHint = {
  candidate: CandidateMoveReview | null;
  kind: CoachHintKind;
  message: string;
  reasons: MoveReviewReason[];
  square: SquareIndex | null;
};

export type CoachHintMessageStyle = "vague" | "specific";

export type CreateCoachHintOptions = Partial<AnalyzeMoveCandidatesOptions> & {
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
};

export type CreateCoachHintsFromAnalysisOptions = {
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
};

const defaultCoachHintSearchDepth = 3;
const actionableRiskScoreGap = 5;
const actionableHelpfulScoreGap = 35;

export function createCoachHint(
  board: Board,
  disc: DiscColor,
  options: CreateCoachHintOptions = {},
): CoachHint | null {
  return createCoachHints(board, disc, options)[0] ?? null;
}

export function createCoachHints(
  board: Board,
  disc: DiscColor,
  {
    includeCandidateFallback = false,
    messageStyle = "specific",
    searchDepth = defaultCoachHintSearchDepth,
  }: CreateCoachHintOptions = {},
): CoachHint[] {
  const analysis = analyzeMoveCandidates(board, disc, { searchDepth });

  return createCoachHintsFromAnalysis(analysis, {
    includeCandidateFallback,
    messageStyle,
  });
}

export function createCoachHintsFromAnalysis(
  analysis: MoveCandidateAnalysis,
  {
    includeCandidateFallback = false,
    messageStyle = "specific",
  }: CreateCoachHintsFromAnalysisOptions = {},
): CoachHint[] {
  const bestCandidate = analysis.candidateMoves[0] ?? null;

  if (bestCandidate === null) {
    return [];
  }

  const hints: CoachHint[] = [];

  const shouldShowShapeRisk = analysis.evaluationSource !== "exactEndgame";
  const cornerGivenRiskCandidate = shouldShowShapeRisk
    ? findRiskCandidate(analysis, (candidate) =>
        candidate.reasons.includes("cornerGiven"),
      )
    : undefined;

  if (cornerGivenRiskCandidate !== undefined) {
    hints.push(createCornerRiskHint(cornerGivenRiskCandidate, messageStyle));
  }

  const mobilityRiskCandidate =
    shouldShowShapeRisk && cornerGivenRiskCandidate === undefined
      ? findRiskCandidate(analysis, (candidate) =>
          candidate.reasons.includes("mobilityLoss"),
        )
      : undefined;

  if (
    mobilityRiskCandidate !== undefined &&
    !hints.some((hint) => hint.square === mobilityRiskCandidate.square)
  ) {
    hints.push(createMobilityRiskHint(mobilityRiskCandidate, messageStyle));
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
    hints.push(createCornerRiskHint(dangerSquareRiskCandidate, messageStyle));
  }

  const helpfulCandidate = findHelpfulCandidate(analysis, {
    includeCandidateFallback,
  });
  const helpfulHint =
    helpfulCandidate === null
      ? null
      : createHelpfulHint({
          candidate: helpfulCandidate,
          evaluationSource: analysis.evaluationSource,
          includeCandidateFallback,
          messageStyle,
        });

  if (
    helpfulHint !== null &&
    !hints.some((hint) => hint.square === helpfulHint.square)
  ) {
    hints.push(helpfulHint);
  }

  return hints;
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

function createHelpfulHint({
  candidate,
  evaluationSource,
  includeCandidateFallback,
  messageStyle,
}: {
  candidate: CandidateMoveReview;
  evaluationSource: "exactEndgame" | "minimax";
  includeCandidateFallback: boolean;
  messageStyle: CoachHintMessageStyle;
}): CoachHint | null {
  if (candidate.reasons.includes("corner")) {
    return createHint({
      candidate,
      kind: "cornerOpportunity",
      message:
        messageStyle === "vague"
          ? "角を取れる場所がありそう。角まわりを見てみよう。"
          : `角を取れる場所がありそう。${formatSquare(
              candidate.square,
            )} を見てみよう。`,
    });
  }

  if (candidate.reasons.includes("mobilityGain")) {
    return createHint({
      candidate,
      kind: "mobility",
      message:
        messageStyle === "vague"
          ? "相手が少し動きづらくなる手がありそう。次の形を見てみよう。"
          : `相手が少し動きづらくなる手がありそう。${formatSquare(
              candidate.square,
            )} の後の形を見てみよう。`,
    });
  }

  if (evaluationSource === "exactEndgame") {
    return createHint({
      candidate,
      kind: "endgame",
      message:
        messageStyle === "vague"
          ? "終盤は最後に残る石数を見たいところ。候補を少し比べてみよう。"
          : `終盤は最後に残る石数を見たいところ。${formatSquare(
              candidate.square,
            )} から試してみよう。`,
    });
  }

  if (includeCandidateFallback) {
    return createHint({
      candidate,
      kind: "candidate",
      message:
        messageStyle === "vague"
          ? "迷ったら、置いた後の形を少し見てみよう。"
          : `迷ったら、${formatSquare(
              candidate.square,
            )} の後の形を少し見てみよう。`,
    });
  }

  return null;
}

function createCornerRiskHint(
  candidate: CandidateMoveReview,
  messageStyle: CoachHintMessageStyle,
): CoachHint {
  return createHint({
    candidate,
    kind: "cornerRisk",
    message:
      messageStyle === "vague"
        ? "角の近くは少し注意。ここに置く前に、相手が角へ行けないか見てみよう。"
        : `角の近くは少し注意。${formatSquare(
            candidate.square,
          )} は、置いた後に相手が角へ行けないか見てみよう。`,
  });
}

function createMobilityRiskHint(
  candidate: CandidateMoveReview,
  messageStyle: CoachHintMessageStyle,
): CoachHint {
  return createHint({
    candidate,
    kind: "mobilityRisk",
    message:
      messageStyle === "vague"
        ? "置いた後に、自分の行き先が少なくなりそうな手もありそう。次の形を見てみよう。"
        : `${formatSquare(
            candidate.square,
          )} は、置いた後に自分の行き先が少なくならないか見てみよう。`,
  });
}

function createHint({
  candidate,
  kind,
  message,
}: {
  candidate: CandidateMoveReview;
  kind: CoachHintKind;
  message: string;
}): CoachHint {
  return {
    candidate,
    kind,
    message,
    reasons: candidate.reasons,
    square: candidate.square,
  };
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
