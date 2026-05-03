type ReviewScreenProps = {
  onBackToResult: () => void;
  onBackToStart: () => void;
};

export function ReviewScreen({
  onBackToResult,
  onBackToStart,
}: ReviewScreenProps) {
  return (
    <section className="review-screen" aria-labelledby="review-title">
      <div className="review-panel">
        <p className="eyebrow">Teacher Review</p>
        <h1 id="review-title">ふりかえり</h1>
        <p className="review-panel__status">準備中</p>
        <div className="game-actions review-panel__actions">
          <button
            className="game-action game-action--primary"
            onClick={onBackToResult}
            type="button"
          >
            Result に戻る
          </button>
          <button className="game-action" onClick={onBackToStart} type="button">
            Title Screen
          </button>
        </div>
      </div>
    </section>
  );
}
