import type { PositionReview } from "../../teacher";
import type { MoveRecord } from "../../game/session";
import { formatDisc, formatSquare } from "./reviewFormat";

type ReviewPlaybackDetailProps = {
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  maxMoveNumber: number;
  positionReview: PositionReview;
};

export function ReviewPlaybackDetail({
  currentMove,
  currentMoveNumber,
  maxMoveNumber,
  positionReview,
}: ReviewPlaybackDetailProps) {
  return (
    <dl className="review-detail">
      <div>
        <dt>手数</dt>
        <dd>
          {currentMoveNumber} / {maxMoveNumber}
        </dd>
      </div>
      <div>
        <dt>直前の手</dt>
        <dd>
          {currentMove === null ? "初期盤面" : formatSquare(currentMove.square)}
        </dd>
      </div>
      <div>
        <dt>おすすめ</dt>
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
