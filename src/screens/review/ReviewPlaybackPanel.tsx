import { ReviewBoard } from "../../components/ReviewBoard";
import type { Board } from "../../game/othello";
import type { MoveRecord } from "../../game/session";
import type { PositionReview } from "../../teacher";
import { ReviewLegend } from "./ReviewLegend";
import { ReviewPlaybackControls } from "./ReviewPlaybackControls";
import type { ReviewPlaybackMode } from "./reviewPlayback";

type ReviewPlaybackPanelProps = {
  currentBoard: Board;
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  maxMoveNumber: number;
  mode: ReviewPlaybackMode;
  onGoToMove: (moveNumber: number) => void;
  positionReview: PositionReview;
};

export function ReviewPlaybackPanel({
  currentBoard,
  currentMove,
  currentMoveNumber,
  maxMoveNumber,
  mode,
  onGoToMove,
  positionReview,
}: ReviewPlaybackPanelProps) {
  return (
    <section className="review-board-panel">
      <ReviewBoard
        bestSquare={positionReview.bestSquare}
        board={currentBoard}
        legalMoves={positionReview.legalMoves}
        playedSquare={currentMove?.square ?? null}
      />
      <ReviewPlaybackControls
        currentMoveNumber={currentMoveNumber}
        maxMoveNumber={maxMoveNumber}
        onGoToMove={onGoToMove}
      />
      <ReviewLegend
        bestLabel={mode === "reviewTarget" ? "試してみたい手" : "次に見たい手"}
      />
    </section>
  );
}
