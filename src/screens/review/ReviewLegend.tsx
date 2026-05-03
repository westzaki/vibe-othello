export function ReviewLegend() {
  return (
    <div className="review-legend" aria-label="Review board legend">
      <span>
        <i className="review-legend__marker review-legend__marker--played" />
        実際の手
      </span>
      <span>
        <i className="review-legend__marker review-legend__marker--best" />
        おすすめ手
      </span>
      <span>
        <i className="review-legend__marker review-legend__marker--legal" />
        合法手
      </span>
    </div>
  );
}
