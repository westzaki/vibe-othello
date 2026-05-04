type ReviewPlaybackControlsProps = {
  currentMoveNumber: number;
  maxMoveNumber: number;
  onGoToMove: (moveNumber: number) => void;
};

export function ReviewPlaybackControls({
  currentMoveNumber,
  maxMoveNumber,
  onGoToMove,
}: ReviewPlaybackControlsProps) {
  return (
    <div className="review-playback-group">
      <div className="review-playback">
        <button
          className="game-action"
          disabled={currentMoveNumber === 0}
          onClick={() => onGoToMove(currentMoveNumber - 1)}
          type="button"
        >
          前へ
        </button>
        <button
          className="game-action"
          disabled={currentMoveNumber === maxMoveNumber}
          onClick={() => onGoToMove(currentMoveNumber + 1)}
          type="button"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
