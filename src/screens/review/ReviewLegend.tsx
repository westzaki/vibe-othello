type ReviewLegendProps = {
  bestLabel: string;
};

export function ReviewLegend({ bestLabel }: ReviewLegendProps) {
  return (
    <div className="review-legend" aria-label="Review board legend">
      <span>
        <i className="review-legend__marker review-legend__marker--played" />
        実際の手
      </span>
      <span>
        <i className="review-legend__marker review-legend__marker--best" />
        {bestLabel}
      </span>
      <span>
        <i className="review-legend__marker review-legend__marker--legal" />
        置ける場所
      </span>
    </div>
  );
}
