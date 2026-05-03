import { ReviewBoard } from "../../components/ReviewBoard";
import type { Board } from "../../game/othello";
import type { MoveRecord } from "../../game/session";
import { ReviewLegend } from "./ReviewLegend";
import { ReviewPlaybackControls } from "./ReviewPlaybackControls";
import { ReviewPlaybackDetail } from "./ReviewPlaybackDetail";
import type { PlaybackPositionReview } from "./reviewPlayback";

type ReviewPlaybackPanelProps = {
  currentBoard: Board;
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  maxMoveNumber: number;
  onGoToMove: (moveNumber: number) => void;
  onStartPractice: () => void;
  positionReview: PlaybackPositionReview;
};

export function ReviewPlaybackPanel({
  currentBoard,
  currentMove,
  currentMoveNumber,
  maxMoveNumber,
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
      <ReviewLegend />
    </section>
  );
}
