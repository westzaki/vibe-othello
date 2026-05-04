import { countEmptySquares } from "../cpu";
import type { SquareIndex } from "../game/othello";
import type {
  GameReview,
  GameReviewMessages,
  MoveReview,
  MoveReviewMessage,
  ReviewMoveComparison,
  ReviewedMove,
} from "./reviewTypes";

const exactEndgameMessageEmptyThreshold = 10;

export function createGameReviewMessages(
  review: GameReview,
): GameReviewMessages {
  return {
    advice: createAdvice(review.reviewedMoves),
    moveMessages: new Map(
      review.reviewedMoves.map((move) => [
        move.moveNumber,
        createMoveReviewMessage(move),
      ]),
    ),
  };
}

export function createMoveReviewMessage(
  reviewedMove: MoveReview | ReviewedMove,
): MoveReviewMessage {
  const review = getMoveReview(reviewedMove);
  const usesExactEndgame = usesExactEndgameEvaluation(reviewedMove);

  return {
    comparison: createMoveComparison(reviewedMove, usesExactEndgame),
    explanation: createExplanation(review, usesExactEndgame),
    suggestion: createSuggestion(review, usesExactEndgame),
  };
}

function getMoveReview(reviewedMove: MoveReview | ReviewedMove): MoveReview {
  return "review" in reviewedMove ? reviewedMove.review : reviewedMove;
}

function createMoveComparison(
  reviewedMove: MoveReview | ReviewedMove,
  usesExactEndgame: boolean,
): ReviewMoveComparison | undefined {
  if (!("review" in reviewedMove) || reviewedMove.review.kind !== "bad") {
    return undefined;
  }

  const review = reviewedMove.review;
  const trialCandidate =
    review.bestSquare === null
      ? null
      : (reviewedMove.candidateMoves.find(
          (candidate) => candidate.square === review.bestSquare,
        ) ?? null);
  const trialMove =
    review.bestSquare === null || review.bestScore === null
      ? null
      : {
          bestScore: review.bestScore,
          explanation: createTrialMoveExplanation(
            review,
            trialCandidate,
            usesExactEndgame,
          ),
          reasons: trialCandidate?.reasons ?? [],
          square: review.bestSquare,
        };

  return {
    nextFocus: createComparisonFocus(review, usesExactEndgame),
    playedMove: {
      explanation: createPlayedMoveExplanation(review, usesExactEndgame),
      playedScore: review.playedScore,
      reasons: review.reasons,
      square: review.square,
    },
    trialMove,
  };
}

function createPlayedMoveExplanation(
  review: MoveReview,
  usesExactEndgame: boolean,
): string {
  if (usesExactEndgame) {
    return "終盤なので、最後まで進めたときの石の残り方まで見ると少し苦しい形だったかも。";
  }

  if (review.reasons.includes("cornerGiven")) {
    return "置いた後に、相手が角へ近づける形になりやすかったかも。";
  }

  if (review.reasons.includes("dangerSquare")) {
    return "角の近くに置く手だったね。急ぐ前に、角まわりの形をもう一回見てもよさそう。";
  }

  if (review.reasons.includes("mobilityLoss")) {
    return "たくさん返せても、次の自分の置ける場所が少し減ったかも。";
  }

  if (review.reasons.includes("turningPoint")) {
    return "このあと、相手が少し動きやすい流れになったかも。";
  }

  return "自然な一手だったね。次は、置いた後の相手の置ける場所も一緒に見てみよう。";
}

function createTrialMoveExplanation(
  review: MoveReview,
  trialCandidate: ReviewedMove["candidateMoves"][number] | null,
  usesExactEndgame: boolean,
): string {
  if (usesExactEndgame) {
    return "最後まで置いたときに、こちらの石を少し残しやすい手かも。";
  }

  if (trialCandidate?.reasons.includes("corner")) {
    return "角を大事にしながら、流れを作りやすい手かも。";
  }

  if (trialCandidate?.reasons.includes("dangerSquare")) {
    return "角の近くだから、ここも形を比べながら試してみたい手だね。";
  }

  if (review.reasons.includes("cornerGiven")) {
    return "角まわりのリスクを少し避けながら、相手の置ける場所を比べやすい手かも。";
  }

  if (review.reasons.includes("mobilityLoss")) {
    return "返す数は少なくても、次の置き場所を残しやすいか比べてみたい手かも。";
  }

  if (review.reasons.includes("turningPoint")) {
    return "相手のチャンスを増やしにくい形か、比べてみたい手かも。";
  }

  return "返す数だけでなく、相手にいい手をあげにくいか比べてみたい手かも。";
}

function createComparisonFocus(
  review: MoveReview,
  usesExactEndgame: boolean,
): string {
  if (usesExactEndgame) {
    return "終盤は、今返す数より最後に残る石数を比べてみよう。";
  }

  if (review.reasons.includes("cornerGiven")) {
    return "相手の角チャンスが増えていないか見てみよう。";
  }

  if (review.reasons.includes("dangerSquare")) {
    return "角の近くに置く前に、空いている角を一回だけ確認してみよう。";
  }

  if (review.reasons.includes("mobilityLoss")) {
    return "置いた後に、自分と相手がどこへ置けるか見てみよう。";
  }

  if (review.reasons.includes("turningPoint")) {
    return "置いたあと、相手のチャンスが増えていないか見てみよう。";
  }

  return "置いた後に、相手がどこへ置けるか見てみよう。";
}

function createExplanation(
  review: MoveReview,
  usesExactEndgame: boolean,
): string {
  if (review.kind === "bad") {
    if (usesExactEndgame) {
      return `${formatSquare(
        review.square,
      )} は終盤の分かれ道だったかも。最後まで進めると、別の手のほうが石を残しやすい局面でした。`;
    }

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

    if (review.reasons.includes("turningPoint")) {
      return `${formatSquare(
        review.square,
      )} はここで少し流れが変わったかも。このあと相手が動きやすくなっていないか見てみよう。`;
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

function createSuggestion(
  review: MoveReview,
  usesExactEndgame: boolean,
): string | undefined {
  if (review.kind !== "bad" || review.bestSquare === null) {
    return undefined;
  }

  if (usesExactEndgame) {
    return `この終盤では ${formatSquare(
      review.bestSquare,
    )} も試してみる？最後まで置いたときに、どちらの石が多く残るか比べると見えやすいかも。`;
  }

  return `この局面では ${formatSquare(
    review.bestSquare,
  )} も試してみる？角まわりと、相手の置ける場所を少し比べると見えやすいかも。`;
}

function createAdvice(reviewedMoves: ReviewedMove[]): string {
  const badMoves = reviewedMoves.filter((move) => move.review.kind === "bad");

  if (badMoves.some(usesExactEndgameEvaluation)) {
    return "終盤は、今たくさん返す手よりも最後に石が残る手を比べてみよう。そこに気づけると、接戦を勝ちに変えやすくなるよ。";
  }

  if (badMoves.some((move) => move.review.reasons.includes("cornerGiven"))) {
    return "次は、置いた後に相手が角へ行けるかを一回だけ見てみよう。そこに気づけると、次はかなり勝ちやすくなるよ。";
  }

  if (badMoves.some((move) => move.review.reasons.includes("dangerSquare"))) {
    return "次は、角の近くを打つ前に少し立ち止まってみよう。急がず選べたら、かなりいい流れになりそう。";
  }

  if (badMoves.some((move) => move.review.reasons.includes("turningPoint"))) {
    return "次は、置いたあとに相手のチャンスが増えていないか一回だけ見てみよう。流れを戻すきっかけが見つかりそう。";
  }

  if (badMoves.length > 0) {
    return "次は、たくさん取れる手だけでなく、相手が次に何をできるかも見てみよう。あと一歩でぐっと良くなりそう。";
  }

  return "いい流れで打てています。次は角と、相手の置ける場所を少し意識できると、もっと勝ちに近づけそう。";
}

function usesExactEndgameEvaluation(
  reviewedMove: MoveReview | ReviewedMove,
): reviewedMove is ReviewedMove {
  return (
    "review" in reviewedMove &&
    countEmptySquares(reviewedMove.boardBefore) <=
      exactEndgameMessageEmptyThreshold
  );
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
