import { useMemo, useState } from "react";
import { ReviewBoard } from "../components/ReviewBoard";
import type { DiscColor, SquareIndex } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import type { useOthelloGame } from "../hooks/useOthelloGame";
import {
  createGameReviewMessages,
  defaultTeacherReviewConfig,
  reviewGame,
  type GameReview,
  type GameReviewMessages,
  type MoveReviewMessage,
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
  const [selectedMoveNumber, setSelectedMoveNumber] = useState<number | null>(
    null,
  );
  const reviewedDisc = getReviewedDisc(game.players);
  const review = useMemo(
    () =>
      reviewedDisc === null
        ? null
        : reviewGame(game.moveHistory, {
            reviewedDisc,
            ...defaultTeacherReviewConfig,
          }),
    [game.moveHistory, reviewedDisc],
  );
  const messages = useMemo(
    () => (review === null ? null : createGameReviewMessages(review)),
    [review],
  );
  const selectableMoves = useMemo(
    () =>
      review === null
        ? []
        : [...review.highlights.goodMoves, ...review.highlights.badMoves].sort(
            (first, second) => first.moveNumber - second.moveNumber,
          ),
    [review],
  );
  const selectedMove =
    selectableMoves.find((move) => move.moveNumber === selectedMoveNumber) ??
    selectableMoves[0] ??
    null;

  return (
    <section className="review-screen" aria-labelledby="review-title">
      <div className="review-panel">
        <p className="eyebrow">Teacher Review</p>
        <h1 id="review-title">ふりかえり</h1>

        {review === null || messages === null ? (
          <p className="review-panel__status">2Pではふりかえりはありません</p>
        ) : (
          <div className="review-layout">
            <section className="review-board-panel">
              <h2 className="review-summary__title">選んだ手の局面</h2>
              {selectedMove === null ? (
                <p className="review-summary__empty">
                  表示できる注目手はありません。
                </p>
              ) : (
                <>
                  <ReviewMoveDetail move={selectedMove} />
                  <ReviewBoard
                    bestSquare={selectedMove.review.bestSquare}
                    board={selectedMove.boardBefore}
                    legalMoves={selectedMove.legalMovesBefore}
                    playedSquare={selectedMove.square}
                  />
                  <ReviewLegend />
                </>
              )}
            </section>

            <div className="review-summary">
              <ReviewMoveSection
                emptyText="今回は大きく流れを良くした手は少なめでした。"
                messages={messages}
                moves={review.highlights.goodMoves}
                onSelectMove={setSelectedMoveNumber}
                selectedMoveNumber={selectedMove?.moveNumber ?? null}
                title="良かった手"
              />
              <ReviewMoveSection
                emptyText="今回は目立った失着はありませんでした。"
                messages={messages}
                moves={review.highlights.badMoves}
                onSelectMove={setSelectedMoveNumber}
                selectedMoveNumber={selectedMove?.moveNumber ?? null}
                title="もったいなかった手"
              />
              <section className="review-summary__section">
                <h2 className="review-summary__title">次のポイント</h2>
                <p className="review-summary__advice">{messages.advice}</p>
              </section>
            </div>
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
  onSelectMove: (moveNumber: number) => void;
  selectedMoveNumber: number | null;
  title: string;
};

function ReviewMoveSection({
  emptyText,
  messages,
  moves,
  onSelectMove,
  selectedMoveNumber,
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
              onSelectMove={onSelectMove}
              selected={move.moveNumber === selectedMoveNumber}
            />
          ))}
        </ul>
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

type ReviewMoveDetailProps = {
  move: ReviewedMove;
};

function ReviewMoveDetail({ move }: ReviewMoveDetailProps) {
  return (
    <dl className="review-detail">
      <div>
        <dt>実際の手</dt>
        <dd>{formatSquare(move.square)}</dd>
      </div>
      <div>
        <dt>おすすめ</dt>
        <dd>
          {move.review.bestSquare === null
            ? "なし"
            : formatSquare(move.review.bestSquare)}
        </dd>
      </div>
      <div>
        <dt>合法手</dt>
        <dd>
          {move.legalMovesBefore.length === 0
            ? "なし"
            : `${move.legalMovesBefore.length}か所`}
        </dd>
      </div>
    </dl>
  );
}

function ReviewLegend() {
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

function getReviewedDisc(players: PlayerSettings): DiscColor | null {
  if (players.black.type === "human" && players.white.type === "cpu") {
    return "black";
  }

  if (players.white.type === "human" && players.black.type === "cpu") {
    return "white";
  }

  return null;
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}
