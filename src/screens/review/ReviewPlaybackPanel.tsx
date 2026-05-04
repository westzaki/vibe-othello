import { ReviewBoard } from "../../components/ReviewBoard";
import type { Board } from "../../game/othello";
import type { MoveRecord } from "../../game/session";
import type { PositionReview } from "../../teacher";
import { ReviewLegend } from "./ReviewLegend";
import { ReviewPlaybackControls } from "./ReviewPlaybackControls";
import { ReviewPlaybackDetail } from "./ReviewPlaybackDetail";
import type { ReviewPlaybackMode } from "./reviewPlayback";

type ReviewPlaybackPanelProps = {
  currentBoard: Board;
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  maxMoveNumber: number;
  mode: ReviewPlaybackMode;
  onGoToMove: (moveNumber: number) => void;
  onStartPractice?: () => void;
  positionReview: PositionReview;
};

export function ReviewPlaybackPanel({
  currentBoard,
  currentMove,
  currentMoveNumber,
  maxMoveNumber,
  mode,
  onGoToMove,
  onStartPractice,
  positionReview,
}: ReviewPlaybackPanelProps) {
  return (
    <section className="review-board-panel">
      <h2 className="review-summary__title">棋譜再生</h2>
      <ReviewPlaybackDetail
        currentMove={currentMove}
        currentMoveNumber={currentMoveNumber}
        maxMoveNumber={maxMoveNumber}
        mode={mode}
        positionReview={positionReview}
      />
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
        onStartPractice={onStartPractice}
      />
      <ReviewLegend
        bestLabel={mode === "reviewTarget" ? "試してみたい手" : "次のおすすめ"}
      />
    </section>
  );
}
