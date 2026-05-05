import type { SquareIndex } from "../game/othello";
import type { CandidateMoveReview } from "./reviewTypes";
import type {
  CoachHint,
  CoachHintDraft,
  CoachHintGuidance,
  CoachHintKind,
  CoachHintMessageStyle,
} from "./coachHintTypes";

export function createCoachHintFromDraft(
  { candidate, guidance, kind, severity }: CoachHintDraft,
  messageStyle: CoachHintMessageStyle,
): CoachHint {
  return {
    candidate,
    guidance,
    kind,
    message: createCoachHintMessage(kind, candidate, messageStyle, guidance),
    reasons: candidate.reasons,
    severity,
    square: candidate.square,
  };
}

function createCoachHintMessage(
  kind: CoachHintKind,
  candidate: CandidateMoveReview,
  messageStyle: CoachHintMessageStyle,
  guidance: CoachHintGuidance | undefined,
): string {
  switch (kind) {
    case "bestMove":
      return createBestMoveHintMessage(candidate, messageStyle, guidance);
    case "cornerOpportunity":
      return messageStyle === "vague"
        ? "角を取れる場所がありそう。角まわりを見てみよう。"
        : `角を取れる場所がありそう。${formatSquare(
            candidate.square,
          )} を見てみよう。`;
    case "stableEdge":
      return messageStyle === "vague"
        ? "角からつながる辺は、強い形になりやすいよ。角につながるマスを見てみよう。"
        : `取った角からつながる辺は、強い形になりやすいよ。${formatSquare(
            candidate.square,
          )} の後の辺を見てみよう。`;
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
        ? "角の近くは少し注意。相手が角へ行けないか見てみよう。"
        : `角の近くは少し注意。${formatSquare(
            candidate.square,
          )} の後に、相手が角へ行けないか見てみよう。`;
    case "mobilityRisk":
      return messageStyle === "vague"
        ? "置いた後に、自分の行き先が少なくなりそうな手もありそう。次の形を見てみよう。"
        : `${formatSquare(
            candidate.square,
          )} は、置いた後に自分の行き先が少なくならないか見てみよう。`;
  }
}

function createBestMoveHintMessage(
  candidate: CandidateMoveReview,
  messageStyle: CoachHintMessageStyle,
  guidance: CoachHintGuidance | undefined,
): string {
  const reason = createBestMoveReason(candidate, guidance, messageStyle);

  return messageStyle === "vague"
    ? reason
    : `まず比べるなら、${formatSquare(
        candidate.square,
      )} が本命候補。${reason}`;
}

function createBestMoveReason(
  candidate: CandidateMoveReview,
  guidance: CoachHintGuidance | undefined,
  messageStyle: CoachHintMessageStyle,
): string {
  if (
    guidance?.refutationSeverity === "high" ||
    guidance?.refutationSeverity === "medium"
  ) {
    return messageStyle === "vague"
      ? "本命候補だけど、相手の返しまで見たい場所があるよ。"
      : "相手の強い返しもあるので、置いた後の形まで確認しよう。";
  }

  if (
    guidance !== undefined &&
    (guidance.opponentPressureScore >= 8 ||
      candidate.metrics.opponentMobilityAfter <= 2)
  ) {
    return messageStyle === "vague"
      ? "相手の行き先を少し絞れそうな場所があるよ。光っているマスの後の形を見てみよう。"
      : "相手の行き先を絞りやすく、返しも悪くなりにくい手。";
  }

  if (candidate.metrics.isCorner) {
    return messageStyle === "vague"
      ? "角を取りながら形を安定させやすい場所がありそう。"
      : "角を取りながら、返しで大きく崩れにくい手。";
  }

  if (candidate.metrics.anchoredEdgeDelta > 0) {
    return messageStyle === "vague"
      ? "角からつながる辺を強くしやすい場所がありそう。"
      : "角からつながる辺を強くしやすい手。";
  }

  if (candidate.metrics.mobilitySwing > 0) {
    return messageStyle === "vague"
      ? "自分の行き先を残しやすい場所がありそう。"
      : "自分の行き先を残しながら、相手を少し動きづらくできる手。";
  }

  if (guidance?.refutationSeverity === "low") {
    return messageStyle === "vague"
      ? "少し返しはあるけど、候補に入れて比べたい場所があるよ。"
      : "少し返しはあるけど、候補に入れて比べたい手。";
  }

  return messageStyle === "vague"
    ? "候補になりそうな場所があるよ。光っているマスの後の形を見てみよう。"
    : "置いた後の相手の返し手も見てみよう。";
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
