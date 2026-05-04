import { ReviewBoard } from "../../components/ReviewBoard";
import type { Board } from "../../game/othello";
import type { MoveRecord } from "../../game/session";
import type { PositionReview } from "../../teacher";
import { ReviewLegend } from "./ReviewLegend";
import type { ReviewPlaybackMode } from "./reviewPlayback";

type ReviewPlaybackPanelProps = {
  currentBoard: Board;
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  mode: ReviewPlaybackMode;
  positionReview: PositionReview;
};

export function ReviewPlaybackPanel({
  currentBoard,
  currentMove,
  currentMoveNumber,
  mode,
  positionReview,
}: ReviewPlaybackPanelProps) {
  return (
    <section className="review-board-panel">
      <p className="review-board-panel__status">
        {mode === "reviewTarget"
          ? `${currentMoveNumber}手目を置く前の局面`
          : "この局面"}
      </p>
      <ReviewBoard
        bestSquare={positionReview.bestSquare}
        board={currentBoard}
        legalMoves={positionReview.legalMoves}
        playedSquare={currentMove?.square ?? null}
      />
      <ReviewLegend
        bestLabel={mode === "reviewTarget" ? "試してみたい手" : "次に見たい手"}
      />
    </section>
  );
}
