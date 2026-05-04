import type { GameReview, ReviewLesson } from "./reviewTypes";

export function createReviewLesson(review: GameReview): ReviewLesson {
  const niceMove = review.highlights.goodMoves[0] ?? null;
  const turningPointCandidate = review.highlights.badMoves[0] ?? null;
  const practiceTarget = turningPointCandidate ?? niceMove;

  return {
    cards: [
      {
        bodyText: "よかった判断を一つだけ見つけて、次の対局でも使える形にしてみよう。",
        emptyText:
          "今回は小さな良い判断が積み重なっていました。次はナイスな場面を一緒に見つけよう。",
        kind: "niceMove",
        move: niceMove,
        title: "今日のナイス",
      },
      {
        bodyText: "流れが変わりやすかった局面を、責めずにもう一回だけ見てみよう。",
        emptyText:
          "大きな分かれ道は少なめでした。今の調子で、角の近くを少しだけ意識してみよう。",
        kind: "turningPoint",
        move: turningPointCandidate,
        title: "ここが分かれ道だったかも",
      },
      {
        bodyText: "次はこの局面を試してみよう。もう一回ここから練習してみる？",
        emptyText:
          "今回はすぐ練習したい局面は少なめでした。次の対局で角まわりを少し見てみよう。",
        kind: "practiceTarget",
        move: practiceTarget,
        title: "次はこれを試してみよう",
      },
    ],
    niceMove,
    practiceTarget,
    turningPointCandidate,
  };
}
