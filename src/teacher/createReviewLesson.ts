import { selectReviewLessonMoves } from "./reviewLessonSelection";
import type {
  GameReview,
  ReviewLesson,
  ReviewOutcome,
  ReviewedMove,
} from "./reviewTypes";

export function createReviewLesson(
  review: GameReview,
  outcome: ReviewOutcome,
): ReviewLesson {
  const { niceMove, practiceTarget, turningPointCandidate, winningPoint } =
    selectReviewLessonMoves({
      badMoves: review.highlights.badMoves,
      goodMoves: review.highlights.goodMoves,
      finalMoveNumber: review.moveCount,
      reviewedMoves: review.reviewedMoves,
    });

  if (outcome === "win") {
    return createWinReviewLesson({
      niceMove,
      winningPoint,
    });
  }

  const practiceBodyText = createPracticeBodyText(practiceTarget, outcome);

  return {
    cards: [
      {
        bodyText: createNiceMoveBodyText(niceMove),
        emptyText:
          "今回は小さな良い判断が積み重なっていました。次はナイスな場面を一緒に見つけよう。",
        kind: "niceMove",
        move: niceMove,
        title: "今日のナイス",
      },
      {
        bodyText: createTurningPointBodyText(turningPointCandidate, outcome),
        emptyText: createTurningPointEmptyText(outcome),
        kind: "turningPoint",
        move: turningPointCandidate,
        title: "ここが分かれ道だったかも",
      },
      {
        actionLabel:
          practiceTarget === null ? undefined : "この局面から練習する",
        bodyText: practiceBodyText,
        emptyText: createPracticeEmptyText(practiceTarget, outcome),
        footerText: createPracticeFooterText(practiceTarget, outcome),
        kind: "practiceTarget",
        move: practiceTarget,
        title: "ここから練習",
      },
    ],
    niceMove,
    practiceTarget,
    turningPointCandidate,
  };
}

function createWinReviewLesson({
  niceMove,
  winningPoint,
}: {
  niceMove: ReviewedMove | null;
  winningPoint: ReviewedMove | null;
}): ReviewLesson {
  return {
    cards: [
      {
        bodyText: createWinningPointBodyText(winningPoint),
        emptyText:
          "大きな一手だけではなく、落ち着いて選べた手が勝ちにつながっていました。",
        kind: "turningPoint",
        move: winningPoint,
        title: "勝てたポイント",
      },
      {
        bodyText:
          "今回できた良い形を、次の対局でも少し意識してみよう。",
        emptyText:
          "次の対局でも、相手にいい手をあげない形を少し意識してみよう。",
        footerText:
          "ふりかえりポイント: 勝てた理由を一つ覚えておくと、次も落ち着いて選びやすくなるよ。",
        kind: "practiceTarget",
        move: null,
        title: "次も使ってみよう",
      },
    ],
    niceMove,
    practiceTarget: null,
    turningPointCandidate: winningPoint,
  };
}

function createNiceMoveBodyText(move: ReviewedMove | null): string {
  if (move === null) {
    return "よかった判断を一つだけ見つけて、次の対局でも使える形にしてみよう。";
  }

  if (move.review.reasons.includes("corner")) {
    return "角を大事にできた場面を見て、次の対局でも見つけやすい形にしてみよう。";
  }

  if (move.review.reasons.includes("mobilityGain")) {
    return "相手の置ける場所を減らせた場面を見て、次の形の作り方をつかんでみよう。";
  }

  if (move.review.reasons.includes("stablePosition")) {
    return "角からつながる辺を強くできた場面を見て、安定しやすい形をつかんでみよう。";
  }

  return "よかった判断を一つだけ見つけて、次の対局でも使える形にしてみよう。";
}

function createWinningPointBodyText(move: ReviewedMove | null): string {
  if (move === null) {
    return "流れを良くできた場面を見て、勝てた理由をつかんでみよう。";
  }

  if (move.review.reasons.includes("corner")) {
    return "角を大事にできた場面を見て、勝てた理由をつかんでみよう。";
  }

  if (move.review.reasons.includes("mobilityGain")) {
    return "相手の置ける場所を減らせた場面を見て、勝てた理由をつかんでみよう。";
  }

  if (move.review.reasons.includes("stablePosition")) {
    return "角からつながる辺を強くできた場面を見て、勝てた理由をつかんでみよう。";
  }

  return "流れを良くできた場面を見て、勝てた理由をつかんでみよう。";
}

function createTurningPointBodyText(
  move: ReviewedMove | null,
  outcome: ReviewOutcome,
): string {
  if (move !== null) {
    return createTurningPointBodyTextFromMove(move);
  }

  if (outcome === "draw") {
    return "かなり接戦だったね。次に一歩抜け出すポイントを、もう一回だけ見てみよう。";
  }

  return "流れが変わりやすかった局面を、次に変えられそうな見方として見てみよう。";
}

function createTurningPointBodyTextFromMove(move: ReviewedMove): string {
  if (move.review.evaluationSource === "exactEndgame") {
    return "終盤で石がどう残るかを比べたい局面だね。最後まで置いた形を見てみよう。";
  }

  if (move.review.reasons.includes("cornerGiven")) {
    return "相手の角チャンスが増えたかを見たい局面だね。置いた後の角まわりを見てみよう。";
  }

  if (move.review.reasons.includes("dangerSquare")) {
    return "空いている角の近くを見たい局面だね。急がず、角へ行かれない形か比べてみよう。";
  }

  if (move.review.reasons.includes("mobilityLoss")) {
    return "置いた後の行き先を見たい局面だね。自分と相手の置ける場所を比べてみよう。";
  }

  return "流れが変わりやすかった局面だね。相手のチャンスが増えていないか見てみよう。";
}

function createTurningPointEmptyText(outcome: ReviewOutcome): string {
  if (outcome === "draw") {
    return "大きな分かれ道は少なめでした。あと一歩抜け出すために、角の近くを少しだけ意識してみよう。";
  }

  return "大きな分かれ道は少なめでした。今の調子で、角の近くを少しだけ意識してみよう。";
}

function createPracticeBodyText(
  move: ReviewedMove | null,
  outcome: ReviewOutcome,
): string {
  if (move === null) {
    if (outcome === "draw") {
      return "接戦から一歩抜け出すために、次の対局で試せるポイントを一つだけ持って帰ろう。";
    }

    return "今回は勝負どころを一緒に見てみよう。次の対局で試せるポイントを一つだけ持って帰れたら十分だよ。";
  }

  if (move.review.bestSquare !== null) {
    return `${move.moveNumber}手目の局面から、${formatSquare(
      move.review.bestSquare,
    )} も試してみよう。${createPracticeTrialFocusText(move)}`;
  }

  return `${move.moveNumber}手目の局面から、もう一回別の形を試してみよう。`;
}

function createPracticeTrialFocusText(move: ReviewedMove): string {
  if (move.review.evaluationSource === "exactEndgame") {
    return "最後に石がどう残るか比べるのがポイントです。";
  }

  if (move.review.reasons.includes("cornerGiven")) {
    return "相手の角チャンスが減るか見てみよう。";
  }

  if (move.review.reasons.includes("dangerSquare")) {
    return "空いている角と、その近くの形を比べてみよう。";
  }

  if (move.review.reasons.includes("mobilityLoss")) {
    return "自分と相手の置ける場所を比べてみよう。";
  }

  return "置いた後の相手のチャンスを比べてみよう。";
}

function createPracticeEmptyText(
  move: ReviewedMove | null,
  outcome: ReviewOutcome,
): string {
  if (move === null) {
    if (outcome === "draw") {
      return "すぐ練習したい局面は少なめでした。次の対局で一歩抜け出せる場所を一緒に探そう。";
    }

    return "今回はすぐ練習したい局面は少なめでした。次の対局で角まわりを少し見てみよう。";
  }

  return "";
}

function createPracticeFooterText(
  move: ReviewedMove | null,
  outcome: ReviewOutcome,
): string {
  if (move === null) {
    if (outcome === "draw") {
      return "練習ポイント: 置いたあとに、相手がどこへ置けるか一回だけ見てみよう。";
    }

    return "練習ポイント: 角の近くに置く前に、空いている角を一回だけ見てみよう。";
  }

  if (move.review.reasons.includes("cornerGiven")) {
    return "練習ポイント: 角まわりを一回だけ確認しよう。";
  }

  if (move.review.reasons.includes("dangerSquare")) {
    return "練習ポイント: 角の近くは急がず、形を見てから置いてみよう。";
  }

  if (move.review.reasons.includes("mobilityLoss")) {
    return "練習ポイント: 置いたあとに、自分と相手の置ける場所を見てみよう。";
  }

  return "練習ポイント: 置いたあとに、相手がどこへ置けるか見てみよう。";
}

function formatSquare(square: number): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
