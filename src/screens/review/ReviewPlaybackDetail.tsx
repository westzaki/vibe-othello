import type { PositionReview } from "../../teacher";
import type { MoveRecord } from "../../game/session";
import { formatDisc, formatSquare } from "./reviewFormat";
import type { ReviewPlaybackMode } from "./reviewPlayback";

type ReviewPlaybackDetailProps = {
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  maxMoveNumber: number;
  mode: ReviewPlaybackMode;
  positionReview: PositionReview;
};

export function ReviewPlaybackDetail({
  currentMove,
  currentMoveNumber,
  maxMoveNumber,
  mode,
  positionReview,
}: ReviewPlaybackDetailProps) {
  const isReviewTarget = mode === "reviewTarget";

  return (
    <dl className="review-detail">
      <div>
        <dt>手数</dt>
        <dd>
          {isReviewTarget
            ? `${currentMoveNumber}手目を打つ前`
            : `${currentMoveNumber} / ${maxMoveNumber}`}
        </dd>
      </div>
      <div>
        <dt>{isReviewTarget ? "実際の手" : "直前の手"}</dt>
        <dd>
          {currentMove === null ? "初期盤面" : formatSquare(currentMove.square)}
        </dd>
      </div>
      <div>
        <dt>{isReviewTarget ? "試したい手" : "次のおすすめ"}</dt>
        <dd>
          {positionReview.bestSquare === null
            ? "なし"
            : `${formatDisc(positionReview.disc)} ${formatSquare(
                positionReview.bestSquare,
              )}`}
        </dd>
      </div>
    </dl>
  );
}
