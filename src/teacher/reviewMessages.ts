import type { SquareIndex } from "../game/othello";
import type {
  GameReview,
  GameReviewMessages,
  MoveReview,
  MoveReviewMessage,
  ReviewedMove,
} from "./reviewTypes";

export function createGameReviewMessages(
  review: GameReview,
): GameReviewMessages {
  return {
    advice: createAdvice(review.reviewedMoves),
    moveMessages: new Map(
      review.reviewedMoves.map((move) => [
        move.moveNumber,
        createMoveReviewMessage(move.review),
      ]),
    ),
  };
}

export function createMoveReviewMessage(review: MoveReview): MoveReviewMessage {
  return {
    explanation: createExplanation(review),
    suggestion: createSuggestion(review),
  };
}

function createExplanation(review: MoveReview): string {
  const scoreGap = getScoreGap(review);

  if (review.kind === "bad") {
    if (review.reasons.includes("cornerGiven")) {
      return `${formatSquare(
        review.square,
      )} の後に相手が角を狙いやすくなっており、苦しい流れにつながった可能性があります。`;
    }

    if (review.reasons.includes("dangerSquare")) {
      return `${formatSquare(
        review.square,
      )} は角の近くの危険なマスで、後の展開を難しくしやすい手に見えます。`;
    }

    return `${formatSquare(
      review.square,
    )} は候補手との差が大きく、評価上は ${Math.round(
      scoreGap,
    )} 点ほど損をした可能性があります。`;
  }

  if (review.reasons.includes("corner")) {
    return `${formatSquare(
      review.square,
    )} で角を取れたため、返されにくい強い形を作れています。`;
  }

  if (review.reasons.includes("mobilityGain")) {
    return `${formatSquare(
      review.square,
    )} は相手の選択肢を抑えながら、自分の次の手を増やせた良い手に見えます。`;
  }

  if (review.kind === "good") {
    return `${formatSquare(
      review.square,
    )} は最善手に近く、局面の流れを崩しにくい手でした。`;
  }

  return `${formatSquare(
    review.square,
  )} は大きな損は少なそうな、自然な進行の一手です。`;
}

function createSuggestion(review: MoveReview): string | undefined {
  if (review.kind !== "bad" || review.bestSquare === null) {
    return undefined;
  }

  return `この局面では ${formatSquare(
    review.bestSquare,
  )} も候補に入れて、数手先の角や合法手の増減を比べるとよさそうです。`;
}

function createAdvice(reviewedMoves: ReviewedMove[]): string {
  const badMoves = reviewedMoves.filter((move) => move.review.kind === "bad");

  if (badMoves.some((move) => move.review.reasons.includes("cornerGiven"))) {
    return "次は、打った後に相手の角手が新しく生まれていないかを確認すると、終盤まで崩れにくくなります。";
  }

  if (badMoves.some((move) => move.review.reasons.includes("dangerSquare"))) {
    return "次は、角の周りのマスを急いで打たず、相手に角を渡しにくい形を意識するともっと安定しそうです。";
  }

  if (badMoves.length > 0) {
    return "次は、打った直後の枚数よりも、相手の返し手まで見て候補を比べると安定します。";
  }

  return "良い流れで打てています。次は角と合法手の数を意識し続けると、さらに安定しやすくなります。";
}

function getScoreGap(review: MoveReview): number {
  return review.bestScore === null ? 0 : review.bestScore - review.playedScore;
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
