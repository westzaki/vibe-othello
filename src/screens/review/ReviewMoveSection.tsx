import type {
  GameReview,
  GameReviewMessages,
  MoveReviewMessage,
  ReviewedMove,
} from "../../teacher";
import { formatSquare } from "./reviewFormat";

type ReviewMoveSectionProps = {
  actionLabel?: string;
  bodyText?: string;
  emptyText: string;
  footerText?: string;
  messages: GameReviewMessages;
  moves: GameReview["reviewedMoves"];
  onAction?: () => void;
  onSelectMove: (moveNumber: number) => void;
  selectedMoveNumber: number | null;
  showComparison?: boolean;
  title: string;
};

export function ReviewMoveSection({
  actionLabel,
  bodyText,
  emptyText,
  footerText,
  messages,
  moves,
  onAction,
  onSelectMove,
  selectedMoveNumber,
  showComparison = false,
  title,
}: ReviewMoveSectionProps) {
  return (
    <section className="review-summary__section">
      <h2 className="review-summary__title">{title}</h2>
      {bodyText !== undefined && (
        <p className="review-summary__caption">{bodyText}</p>
      )}
      {moves.length === 0 ? (
        <p className="review-summary__empty">{emptyText}</p>
      ) : (
        <ul className="review-summary__list">
          {moves.map((move) => (
            <ReviewMoveItem
              key={move.moveNumber}
              message={messages.moveMessages.get(move.moveNumber)}
              move={move}
              onSelectMove={onSelectMove}
              selected={move.moveNumber === selectedMoveNumber}
              showComparison={showComparison}
            />
          ))}
        </ul>
      )}
      {footerText !== undefined && (
        <p className="review-summary__advice">{footerText}</p>
      )}
      {actionLabel !== undefined && onAction !== undefined && (
        <button
          className="game-action game-action--primary review-summary__action"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

type ReviewMoveItemProps = {
  message: MoveReviewMessage | undefined;
  move: ReviewedMove;
  onSelectMove: (moveNumber: number) => void;
  selected: boolean;
  showComparison: boolean;
};

function ReviewMoveItem({
  message,
  move,
  onSelectMove,
  selected,
  showComparison,
}: ReviewMoveItemProps) {
  const comparisonLabel =
    message?.comparison?.trialMove === undefined ||
    message.comparison.trialMove === null
      ? formatSquare(move.square)
      : `${formatSquare(move.square)} → ${formatSquare(
          message.comparison.trialMove.square,
        )}`;

  return (
    <li>
      <button
        aria-pressed={selected}
        className={[
          "review-summary__item",
          selected ? "review-summary__item--selected" : "",
        ].join(" ")}
        onClick={() => onSelectMove(move.moveNumber)}
        type="button"
      >
        <div className="review-summary__move-line">
          <span>#{move.moveNumber}</span>
          <strong>{showComparison ? comparisonLabel : formatSquare(move.square)}</strong>
        </div>
        {message !== undefined && (
          <>
            <p>{message.explanation}</p>
            {showComparison && message.comparison !== undefined && (
              <ReviewMoveComparisonPanel message={message} />
            )}
            {message.suggestion !== undefined && (
              <p className="review-summary__suggestion">{message.suggestion}</p>
            )}
          </>
        )}
      </button>
    </li>
  );
}

function ReviewMoveComparisonPanel({
  message,
}: {
  message: MoveReviewMessage;
}) {
  const comparison = message.comparison;

  if (comparison === undefined) {
    return null;
  }

  return (
    <div className="review-comparison" aria-label="Move comparison">
      <div className="review-comparison__moves">
        <div>
          <span>実際の手</span>
          <strong>{formatSquare(comparison.playedMove.square)}</strong>
          <p>{comparison.playedMove.explanation}</p>
        </div>
        {comparison.trialMove !== null && (
          <div>
            <span>試してみたい手</span>
            <strong>{formatSquare(comparison.trialMove.square)}</strong>
            <p>{comparison.trialMove.explanation}</p>
          </div>
        )}
      </div>
      <p className="review-comparison__focus">
        <strong>次に見るポイント:</strong> {comparison.nextFocus}
      </p>
    </div>
  );
}
