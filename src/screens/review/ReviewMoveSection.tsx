import type {
  GameReview,
  GameReviewMessages,
  MoveReviewMessage,
  ReviewedMove,
} from "../../teacher";
import { formatSquare } from "./reviewFormat";

type ReviewMoveSectionProps = {
  bodyText?: string;
  emptyText: string;
  footerText?: string;
  messages: GameReviewMessages;
  moves: GameReview["reviewedMoves"];
  onSelectMove: (moveNumber: number) => void;
  selectedMoveNumber: number | null;
  title: string;
};

export function ReviewMoveSection({
  bodyText,
  emptyText,
  footerText,
  messages,
  moves,
  onSelectMove,
  selectedMoveNumber,
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
            />
          ))}
        </ul>
      )}
      {footerText !== undefined && (
        <p className="review-summary__advice">{footerText}</p>
      )}
    </section>
  );
}

type ReviewMoveItemProps = {
  message: MoveReviewMessage | undefined;
  move: ReviewedMove;
  onSelectMove: (moveNumber: number) => void;
  selected: boolean;
};

function ReviewMoveItem({
  message,
  move,
  onSelectMove,
  selected,
}: ReviewMoveItemProps) {
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
          <strong>{formatSquare(move.square)}</strong>
        </div>
        {message !== undefined && (
          <>
            <p>{message.explanation}</p>
            {message.suggestion !== undefined && (
              <p className="review-summary__suggestion">{message.suggestion}</p>
            )}
          </>
        )}
      </button>
    </li>
  );
}
