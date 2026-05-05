import type { SquareIndex } from "../game/othello";
import type { CandidateMoveReview } from "./reviewTypes";
import type {
  CoachHint,
  CoachHintDraft,
  CoachHintKind,
  CoachHintMessageStyle,
} from "./coachHintTypes";

export function createCoachHintFromDraft(
  { candidate, kind, severity }: CoachHintDraft,
  messageStyle: CoachHintMessageStyle,
): CoachHint {
  return {
    candidate,
    kind,
    message: createCoachHintMessage(kind, candidate, messageStyle),
    reasons: candidate.reasons,
    severity,
    square: candidate.square,
  };
}

function createCoachHintMessage(
  kind: CoachHintKind,
  candidate: CandidateMoveReview,
  messageStyle: CoachHintMessageStyle,
): string {
  switch (kind) {
    case "cornerOpportunity":
      return messageStyle === "vague"
        ? "角を取れる場所がありそう。角まわりを見てみよう。"
        : `角を取れる場所がありそう。${formatSquare(
            candidate.square,
          )} を見てみよう。`;
    case "mobility":
      return messageStyle === "vague"
        ? "相手が少し動きづらくなる手がありそう。次の形を見てみよう。"
        : `相手が少し動きづらくなる手がありそう。${formatSquare(
            candidate.square,
          )} の後の形を見てみよう。`;
    case "endgame":
      return messageStyle === "vague"
        ? "終盤は最後に残る石数を見たいところ。候補を少し比べてみよう。"
        : `終盤は最後に残る石数を見たいところ。${formatSquare(
            candidate.square,
          )} から試してみよう。`;
    case "candidate":
      return messageStyle === "vague"
        ? "迷ったら、置いた後の形を少し見てみよう。"
        : `迷ったら、${formatSquare(
            candidate.square,
          )} の後の形を少し見てみよう。`;
    case "cornerRisk":
      return messageStyle === "vague"
        ? "角の近くは少し注意。ここに置く前に、相手が角へ行けないか見てみよう。"
        : `角の近くは少し注意。${formatSquare(
            candidate.square,
          )} は、置いた後に相手が角へ行けないか見てみよう。`;
    case "mobilityRisk":
      return messageStyle === "vague"
        ? "置いた後に、自分の行き先が少なくなりそうな手もありそう。次の形を見てみよう。"
        : `${formatSquare(
            candidate.square,
          )} は、置いた後に自分の行き先が少なくならないか見てみよう。`;
  }
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
