import type {
  GameReview,
  MoveReviewReason,
  ReviewLesson,
  ReviewedMove,
} from "./reviewTypes";

const minimumNiceMoveNumber = 4;
const niceMoveReasonPriority: MoveReviewReason[] = [
  "corner",
  "mobilityGain",
  "nearBestMove",
  "bestMove",
];

export function createReviewLesson(review: GameReview): ReviewLesson {
  const niceMove = selectNiceMove(review.highlights.goodMoves);
  const turningPointCandidate = review.highlights.badMoves[0] ?? null;
  const practiceTarget = turningPointCandidate ?? niceMove;
  const practiceBodyText = createPracticeBodyText(practiceTarget);

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
        actionLabel:
          practiceTarget === null ? undefined : "この局面から練習する",
        bodyText: practiceBodyText,
        emptyText: createPracticeEmptyText(practiceTarget),
        footerText: createPracticeFooterText(practiceTarget),
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

function selectNiceMove(goodMoves: ReviewedMove[]): ReviewedMove | null {
  const meaningfulMoves = goodMoves.filter(
    (move) =>
      move.moveNumber >= minimumNiceMoveNumber &&
      move.review.reasons.some((reason) =>
        niceMoveReasonPriority.includes(reason),
      ),
  );

  return meaningfulMoves.sort(compareNiceMoves)[0] ?? null;
}

function compareNiceMoves(
  firstMove: ReviewedMove,
  secondMove: ReviewedMove,
): number {
  return getNiceMovePriority(secondMove) - getNiceMovePriority(firstMove);
}

function getNiceMovePriority(move: ReviewedMove): number {
  return Math.max(
    ...move.review.reasons.map((reason) => {
      const index = niceMoveReasonPriority.indexOf(reason);

      return index === -1 ? 0 : niceMoveReasonPriority.length - index;
    }),
  );
}

function createPracticeBodyText(move: ReviewedMove | null): string {
  if (move === null) {
    return "今回は勝負どころを一緒に見てみよう。次の対局で試せるポイントを一つだけ持って帰れたら十分だよ。";
  }

  if (move.review.bestSquare !== null) {
    return `#${move.moveNumber} の局面から、${formatSquare(
      move.review.bestSquare,
    )} を試してみよう。`;
  }

  return `#${move.moveNumber} の局面から、もう一回別の形を試してみよう。`;
}

function createPracticeEmptyText(move: ReviewedMove | null): string {
  if (move === null) {
    return "今回はすぐ練習したい局面は少なめでした。次の対局で角まわりを少し見てみよう。";
  }

  return "";
}

function createPracticeFooterText(move: ReviewedMove | null): string {
  if (move === null) {
    return "次の対局で見るポイント: 角の近くに置く前に、空いている角を一回だけ見てみよう。";
  }

  if (move.review.reasons.includes("cornerGiven")) {
    return "次の対局で見るポイント: 角まわりを一回だけ確認しよう。";
  }

  if (move.review.reasons.includes("dangerSquare")) {
    return "次の対局で見るポイント: 角の近くは急がず、形を見てから置いてみよう。";
  }

  if (move.review.reasons.includes("mobilityLoss")) {
    return "次の対局で見るポイント: 置いたあとに、自分と相手の置ける場所を見てみよう。";
  }

  return "次の対局で見るポイント: 置いたあとに、相手がどこへ置けるか見てみよう。";
}

function formatSquare(square: number): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
