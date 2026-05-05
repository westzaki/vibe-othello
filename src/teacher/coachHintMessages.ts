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
      if (messageStyle === "vague") {
        return "角を取れる場所がありそう。角まわりを見てみよう。";
      }

      if (messageStyle === "direct") {
        return `${formatSquare(
          candidate.square,
        )} は角を取れる手。角は返されないので、強い候補です。`;
      }

      return `角を取れる場所がありそう。${formatSquare(
        candidate.square,
      )} を見てみよう。`;
    case "stableEdge":
      if (messageStyle === "vague") {
        return "角からつながる辺は、強い形になりやすいよ。角につながるマスを見てみよう。";
      }

      if (messageStyle === "direct") {
        return `${formatSquare(
          candidate.square,
        )} は取った角から辺を伸ばす手。返されにくい形を作れます。`;
      }

      return `取った角からつながる辺は、強い形になりやすいよ。${formatSquare(
        candidate.square,
      )} の後の辺を見てみよう。`;
    case "mobility":
      if (messageStyle === "vague") {
        return "相手が少し動きづらくなる手がありそう。次の形を見てみよう。";
      }

      if (messageStyle === "direct") {
        return `${formatSquare(
          candidate.square,
        )} は相手の置ける場所を減らしやすい手。相手にいい手を渡しにくくなります。`;
      }

      return `相手が少し動きづらくなる手がありそう。${formatSquare(
        candidate.square,
      )} の後の形を見てみよう。`;
    case "endgame":
      if (messageStyle === "vague") {
        return "終盤は最後に残る石数を見たいところ。候補を少し比べてみよう。";
      }

      if (messageStyle === "direct") {
        return `${formatSquare(
          candidate.square,
        )} は終盤で石を残しやすい候補。最後の枚数を増やす狙いです。`;
      }

      return `終盤は最後に残る石数を見たいところ。${formatSquare(
        candidate.square,
      )} から試してみよう。`;
    case "candidate":
      if (messageStyle === "vague") {
        return "迷ったら、置いた後の形を少し見てみよう。";
      }

      if (messageStyle === "direct") {
        return `まず ${formatSquare(
          candidate.square,
        )} を比べよう。置いた後の相手の返しがきつくないかを見る候補です。`;
      }

      return `迷ったら、${formatSquare(
        candidate.square,
      )} の後の形を少し見てみよう。`;
    case "cornerRisk":
      if (messageStyle === "vague") {
        return "角の近くは少し注意。相手が角へ行けないか見てみよう。";
      }

      if (messageStyle === "direct") {
        return `${formatSquare(
          candidate.square,
        )} は注意。置いた後に、相手が角を取れる形になりやすい手です。`;
      }

      return `角の近くは少し注意。${formatSquare(
        candidate.square,
      )} の後に、相手が角へ行けないか見てみよう。`;
    case "mobilityRisk":
      if (messageStyle === "vague") {
        return "置いた後に、自分の行き先が少なくなりそうな手もありそう。次の形を見てみよう。";
      }

      if (messageStyle === "direct") {
        return `${formatSquare(
          candidate.square,
        )} は注意。置くと自分の次の行き先が減って、相手に動かされやすくなります。`;
      }

      return `${formatSquare(
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

  if (messageStyle === "vague") {
    return reason;
  }

  if (messageStyle === "direct") {
    return `${formatSquare(candidate.square)} が本命候補。${reason}`;
  }

  return `まず比べるなら、${formatSquare(
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
    if (messageStyle === "vague") {
      return "本命候補だけど、相手の返しまで見たい場所があるよ。";
    }

    return messageStyle === "direct"
      ? "理由: 候補の中では強いですが、相手の返しが厳しいので次の形まで確認したい手です。"
      : "相手の強い返しもあるので、置いた後の形まで確認しよう。";
  }

  if (
    guidance !== undefined &&
    (guidance.opponentPressureScore >= 8 ||
      candidate.metrics.opponentMobilityAfter <= 2)
  ) {
    if (messageStyle === "vague") {
      return "相手の行き先を少し絞れそうな場所があるよ。光っているマスの後の形を見てみよう。";
    }

    return messageStyle === "direct"
      ? "理由: 相手の置ける場所を減らしやすく、強い返しを受けにくいからです。"
      : "相手の行き先を絞りやすく、返しも悪くなりにくい手。";
  }

  if (candidate.metrics.isCorner) {
    if (messageStyle === "vague") {
      return "角を取りながら形を安定させやすい場所がありそう。";
    }

    return messageStyle === "direct"
      ? "理由: 角を取れて、その後も返されにくい形になるからです。"
      : "角を取りながら、返しで大きく崩れにくい手。";
  }

  if (candidate.metrics.anchoredEdgeDelta > 0) {
    if (messageStyle === "vague") {
      return "角からつながる辺を強くしやすい場所がありそう。";
    }

    return messageStyle === "direct"
      ? "理由: 取った角から辺を伸ばせて、返されにくい石を増やせるからです。"
      : "角からつながる辺を強くしやすい手。";
  }

  if (candidate.metrics.mobilitySwing > 0) {
    if (messageStyle === "vague") {
      return "自分の行き先を残しやすい場所がありそう。";
    }

    return messageStyle === "direct"
      ? "理由: 自分の行き先を残しながら、相手の選択肢を減らせるからです。"
      : "自分の行き先を残しながら、相手を少し動きづらくできる手。";
  }

  if (guidance?.refutationSeverity === "low") {
    if (messageStyle === "vague") {
      return "少し返しはあるけど、候補に入れて比べたい場所があるよ。";
    }

    return messageStyle === "direct"
      ? "理由: 少し返しはありますが、候補の中では形が崩れにくいからです。"
      : "少し返しはあるけど、候補に入れて比べたい手。";
  }

  if (messageStyle === "vague") {
    return "候補になりそうな場所があるよ。光っているマスの後の形を見てみよう。";
  }

  return messageStyle === "direct"
    ? "理由: 置いた後の相手の返しが、ほかの候補よりきつくなりにくいからです。"
    : "置いた後の相手の返し手も見てみよう。";
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
