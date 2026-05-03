import type { DiscColor } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import type { useOthelloGame } from "../hooks/useOthelloGame";
import {
  createGameReviewMessages,
  defaultTeacherReviewConfig,
  reviewGame,
  type GameReview,
  type GameReviewMessages,
  type ReviewedMove,
} from "../teacher";

type ReviewScreenProps = {
  game: ReturnType<typeof useOthelloGame>;
  onBackToResult: () => void;
  onBackToStart: () => void;
};

export function ReviewScreen({
  game,
  onBackToResult,
  onBackToStart,
}: ReviewScreenProps) {
  const reviewedDisc = getReviewedDisc(game.players);
  const review =
    reviewedDisc === null
      ? null
      : reviewGame(game.moveHistory, {
          reviewedDisc,
          ...defaultTeacherReviewConfig,
        });
  const messages = review === null ? null : createGameReviewMessages(review);

  return (
    <section className="review-screen" aria-labelledby="review-title">
      <div className="review-panel">
        <p className="eyebrow">Teacher Review</p>
        <h1 id="review-title">ふりかえり</h1>

        {review === null || messages === null ? (
          <p className="review-panel__status">2Pではふりかえりはありません</p>
        ) : (
          <div className="review-summary">
            <ReviewMoveSection
              emptyText="今回は大きく流れを良くした手は少なめでした。"
              messages={messages}
              moves={review.highlights.goodMoves}
              title="良かった手"
            />
            <ReviewMoveSection
              emptyText="今回は目立った失着はありませんでした。"
              messages={messages}
              moves={review.highlights.badMoves}
              title="もったいなかった手"
            />
            <section className="review-summary__section">
              <h2 className="review-summary__title">次のポイント</h2>
              <p className="review-summary__advice">{messages.advice}</p>
            </section>
          </div>
        )}

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

type ReviewMoveSectionProps = {
  emptyText: string;
  messages: GameReviewMessages;
  moves: GameReview["reviewedMoves"];
  title: string;
};

function ReviewMoveSection({
  emptyText,
  messages,
  moves,
  title,
}: ReviewMoveSectionProps) {
  return (
    <section className="review-summary__section">
      <h2 className="review-summary__title">{title}</h2>
      {moves.length === 0 ? (
        <p className="review-summary__empty">{emptyText}</p>
      ) : (
        <ul className="review-summary__list">
          {moves.map((move) => (
            <ReviewMoveItem
              key={move.moveNumber}
              message={messages.moveMessages.get(move.moveNumber)}
              move={move}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

type ReviewMoveItemProps = {
  message: GameReviewMessages["moveMessages"] extends Map<number, infer Message>
    ? Message | undefined
    : never;
  move: ReviewedMove;
};

function ReviewMoveItem({ message, move }: ReviewMoveItemProps) {
  return (
    <li className="review-summary__item">
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
    </li>
  );
}

function getReviewedDisc(players: PlayerSettings): DiscColor | null {
  if (players.black.type === "human" && players.white.type === "cpu") {
    return "black";
  }

  if (players.white.type === "human" && players.black.type === "cpu") {
    return "white";
  }

  return null;
}

function formatSquare(square: number): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
