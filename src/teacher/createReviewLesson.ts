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
  const { niceMove, practiceTarget, turningPointCandidate } =
    selectReviewLessonMoves({
      badMoves: review.highlights.badMoves,
      goodMoves: review.highlights.goodMoves,
    });

  if (outcome === "win") {
    return createWinReviewLesson({
      niceMove,
      winningPoint: niceMove,
    });
  }

  const practiceBodyText = createPracticeBodyText(practiceTarget, outcome);

  return {
    cards: [
      {
        bodyText:
          "よかった判断を一つだけ見つけて、次の対局でも使える形にしてみよう。",
        emptyText:
          "今回は小さな良い判断が積み重なっていました。次はナイスな場面を一緒に見つけよう。",
        kind: "niceMove",
        move: niceMove,
        title: "今日のナイス",
      },
      {
        bodyText: createTurningPointBodyText(outcome),
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
        bodyText:
          "流れを良くできた場面を見て、勝てた理由をつかんでみよう。",
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

function createTurningPointBodyText(outcome: ReviewOutcome): string {
  if (outcome === "draw") {
    return "かなり接戦だったね。次に一歩抜け出すポイントを、もう一回だけ見てみよう。";
  }

  return "流れが変わりやすかった局面を、責めずにもう一回だけ見てみよう。";
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
    )} を試してみよう。`;
  }

  return `${move.moveNumber}手目の局面から、もう一回別の形を試してみよう。`;
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
