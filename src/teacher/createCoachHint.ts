import type { Board, DiscColor, SquareIndex } from "../game/othello";
import {
  analyzeMoveCandidates,
  type AnalyzeMoveCandidatesOptions,
} from "./analyzeMoveCandidates";
import type { CandidateMoveReview, MoveReviewReason } from "./reviewTypes";

export type CoachHintKind =
  | "cornerOpportunity"
  | "cornerRisk"
  | "mobility"
  | "endgame";

export type CoachHint = {
  candidate: CandidateMoveReview | null;
  kind: CoachHintKind;
  message: string;
  reasons: MoveReviewReason[];
  square: SquareIndex | null;
};

export type CoachHintMessageStyle = "vague" | "specific";

export type CreateCoachHintOptions = Partial<AnalyzeMoveCandidatesOptions> & {
  messageStyle?: CoachHintMessageStyle;
};

const defaultCoachHintSearchDepth = 3;

export function createCoachHint(
  board: Board,
  disc: DiscColor,
  {
    messageStyle = "specific",
    searchDepth = defaultCoachHintSearchDepth,
  }: CreateCoachHintOptions = {},
): CoachHint | null {
  const analysis = analyzeMoveCandidates(board, disc, { searchDepth });
  const bestCandidate = analysis.candidateMoves[0] ?? null;

  if (bestCandidate === null) {
    return null;
  }

  if (bestCandidate.reasons.includes("corner")) {
    return createHint({
      candidate: bestCandidate,
      kind: "cornerOpportunity",
      message:
        messageStyle === "vague"
          ? "角を取れる場所がありそう。角まわりを見てみよう。"
          : `角を取れる場所がありそう。${formatSquare(
              bestCandidate.square,
            )} を見てみよう。`,
    });
  }

  const cornerRiskCandidate = analysis.candidateMoves.find((candidate) =>
    candidate.reasons.some((reason) =>
      ["cornerGiven", "dangerSquare"].includes(reason),
    ),
  );

  if (cornerRiskCandidate !== undefined) {
    return createHint({
      candidate: cornerRiskCandidate,
      kind: "cornerRisk",
      message:
        messageStyle === "vague"
          ? "角の近くは少し注意。ここに置く前に、相手が角へ行けないか見てみよう。"
          : `角の近くは少し注意。${formatSquare(
              cornerRiskCandidate.square,
            )} は、置いた後に相手が角へ行けないか見てみよう。`,
    });
  }

  if (bestCandidate.reasons.includes("mobilityGain")) {
    return createHint({
      candidate: bestCandidate,
      kind: "mobility",
      message:
        messageStyle === "vague"
          ? "相手が少し動きづらくなる手がありそう。次の形を見てみよう。"
          : `相手が少し動きづらくなる手がありそう。${formatSquare(
              bestCandidate.square,
            )} の後の形を見てみよう。`,
    });
  }

  if (analysis.evaluationSource === "exactEndgame") {
    return createHint({
      candidate: bestCandidate,
      kind: "endgame",
      message:
        messageStyle === "vague"
          ? "終盤は最後に残る石数を見たいところ。候補を少し比べてみよう。"
          : `終盤は最後に残る石数を見たいところ。${formatSquare(
              bestCandidate.square,
            )} から試してみよう。`,
    });
  }

  return null;
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
