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
  if (review.kind === "bad") {
    if (review.reasons.includes("cornerGiven")) {
      return `${formatSquare(
        review.square,
      )} は勝負の分かれ道だったかも。置いた後に、相手が角へ近づけるか見てみるとよさそう。`;
    }

    if (review.reasons.includes("dangerSquare")) {
      return `${formatSquare(
        review.square,
      )} は角の近くだね。ここは急がず、もう一回だけ形を見てみるのもアリかも。`;
    }

    return `${formatSquare(
      review.square,
    )} はちょっと分かれ道だったかも。次は置いた後の相手の返し手も見てみよう。`;
  }

  if (review.reasons.includes("corner")) {
    return `${formatSquare(
      review.square,
    )} で角を取れたの、すごくいい判断だね。返されにくい場所を大事にできています。`;
  }

  if (review.reasons.includes("mobilityGain")) {
    return `${formatSquare(
      review.square,
    )} は相手を少し動きづらくできた手だね。次の形まで見られていていい感じ。`;
  }

  if (review.kind === "good") {
    return `${formatSquare(
      review.square,
    )} は流れを崩しにくい、落ち着いた一手だったと思う。ちゃんと考えた感じが出ています。`;
  }

  return `${formatSquare(
    review.square,
  )} は自然に打てていました。次も盤面全体を見ながら選んでみよう。`;
}

function createSuggestion(review: MoveReview): string | undefined {
  if (review.kind !== "bad" || review.bestSquare === null) {
    return undefined;
  }

  return `この局面では ${formatSquare(
    review.bestSquare,
  )} も候補に入れてみる？角まわりと、相手の置ける場所を少し比べると見えやすいかも。`;
}

function createAdvice(reviewedMoves: ReviewedMove[]): string {
  const badMoves = reviewedMoves.filter((move) => move.review.kind === "bad");

  if (badMoves.some((move) => move.review.reasons.includes("cornerGiven"))) {
    return "次は、置いた後に相手が角へ行けるかを一回だけ見てみよう。そこに気づけると、次はかなり勝ちやすくなるよ。";
  }

  if (badMoves.some((move) => move.review.reasons.includes("dangerSquare"))) {
    return "次は、角の近くを打つ前に少し立ち止まってみよう。急がず選べたら、かなりいい流れになりそう。";
  }

  if (badMoves.length > 0) {
    return "次は、たくさん取れる手だけでなく、相手が次に何をできるかも見てみよう。あと一歩でぐっと良くなりそう。";
  }

  return "いい流れで打てています。次は角と、相手の置ける場所を少し意識できると、もっと勝ちに近づけそう。";
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
