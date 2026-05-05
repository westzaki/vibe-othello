type PracticeBannerProps = {
  feedbackText: string | null;
  onBackToReview?: () => void;
};

export function PracticeBanner({
  feedbackText,
  onBackToReview,
}: PracticeBannerProps) {
  return (
    <div className="practice-banner" aria-label="Practice session">
      <span>練習モード</span>
      <strong>ふりかえりから練習中</strong>
      {feedbackText !== null && (
        <p className="practice-banner__feedback" role="status">
          {feedbackText}
        </p>
      )}
      {onBackToReview !== undefined && (
        <button className="game-action" onClick={onBackToReview} type="button">
          ふりかえりへ
        </button>
      )}
    </div>
  );
}
