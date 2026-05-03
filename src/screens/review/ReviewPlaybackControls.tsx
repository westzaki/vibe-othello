type ReviewPlaybackControlsProps = {
  currentMoveNumber: number;
  maxMoveNumber: number;
  onGoToMove: (moveNumber: number) => void;
  onStartPractice: () => void;
};

export function ReviewPlaybackControls({
  currentMoveNumber,
  maxMoveNumber,
  onGoToMove,
  onStartPractice,
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
        <span className="review-playback__status">{currentMoveNumber}手目</span>
        <button
          className="game-action"
          disabled={currentMoveNumber === maxMoveNumber}
          onClick={() => onGoToMove(currentMoveNumber + 1)}
          type="button"
        >
          次へ
        </button>
      </div>
      <button
        className="game-action game-action--primary review-playback__practice"
        onClick={onStartPractice}
        type="button"
      >
        ここから練習
      </button>
    </div>
  );
}
