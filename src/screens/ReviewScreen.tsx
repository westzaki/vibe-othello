import { useMemo } from "react";
import { createInitialBoard, type DiscColor } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import type { PracticeSessionOptions } from "../game/session";
import type { useOthelloGame } from "../hooks/useOthelloGame";
import {
  createGameReviewMessages,
  defaultTeacherReviewConfig,
  reviewGame,
} from "../teacher";
import { ReviewMoveSection } from "./review/ReviewMoveSection";
import { ReviewPlaybackPanel } from "./review/ReviewPlaybackPanel";
import {
  clampMoveNumber,
  createPlaybackBoards,
  createPlaybackPositionReview,
  createPracticeOptionsFromMoveNumber,
  getNextDiscForMoveNumber,
} from "./review/reviewPlayback";

type ReviewScreenProps = {
  currentMoveNumber: number;
  game: ReturnType<typeof useOthelloGame>;
  onBackToResult: () => void;
  onBackToStart: () => void;
  onMoveNumberChange: (moveNumber: number) => void;
  onStartPractice: (options: PracticeSessionOptions) => void;
};

export function ReviewScreen({
  currentMoveNumber,
  game,
  onBackToResult,
  onBackToStart,
  onMoveNumberChange,
  onStartPractice,
}: ReviewScreenProps) {
  const reviewedDisc = getReviewedDisc(game.players);
  const playbackBoards = useMemo(
    () => createPlaybackBoards(game.moveHistory),
    [game.moveHistory],
  );
  const maxMoveNumber = playbackBoards.length - 1;
  const safeMoveNumber = Math.min(currentMoveNumber, maxMoveNumber);
  const currentBoard = playbackBoards[safeMoveNumber] ?? createInitialBoard();
  const currentMove =
    safeMoveNumber === 0
      ? null
      : (game.moveHistory[safeMoveNumber - 1] ?? null);
  const positionReview = useMemo(
    () =>
      createPlaybackPositionReview(
        currentBoard,
        getNextDiscForMoveNumber(game.moveHistory, safeMoveNumber),
      ),
    [currentBoard, game.moveHistory, safeMoveNumber],
  );
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
  const activeReviewedMove =
    selectableMoves.find((move) => move.moveNumber === safeMoveNumber) ?? null;

  function goToMove(moveNumber: number) {
    onMoveNumberChange(clampMoveNumber(moveNumber, maxMoveNumber));
  }

  function selectReviewMove(moveNumber: number) {
    goToMove(moveNumber);
  }

  function startPractice() {
    onStartPractice(
      createPracticeOptionsFromMoveNumber(
        game.moveHistory,
        playbackBoards,
        safeMoveNumber,
      ),
    );
  }

  return (
    <section className="review-screen" aria-labelledby="review-title">
      <div className="review-panel">
        <p className="eyebrow">Teacher Review</p>
        <h1 id="review-title">ふりかえり</h1>

        {review === null || messages === null ? (
          <p className="review-panel__status">2Pではふりかえりはありません</p>
        ) : (
          <div className="review-layout">
            <ReviewPlaybackPanel
              currentBoard={currentBoard}
              currentMove={currentMove}
              currentMoveNumber={safeMoveNumber}
              maxMoveNumber={maxMoveNumber}
              onGoToMove={goToMove}
              onStartPractice={startPractice}
              positionReview={positionReview}
            />

            <div className="review-summary">
              <ReviewMoveSection
                emptyText="今回は大きく流れを良くした手は少なめでした。"
                messages={messages}
                moves={review.highlights.goodMoves}
                onSelectMove={selectReviewMove}
                selectedMoveNumber={activeReviewedMove?.moveNumber ?? null}
                title="良かった手"
              />
              <ReviewMoveSection
                emptyText="今回は目立った失着はありませんでした。"
                messages={messages}
                moves={review.highlights.badMoves}
                onSelectMove={selectReviewMove}
                selectedMoveNumber={activeReviewedMove?.moveNumber ?? null}
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

function getReviewedDisc(players: PlayerSettings): DiscColor | null {
  if (players.black.type === "human" && players.white.type === "cpu") {
    return "black";
  }

  if (players.white.type === "human" && players.black.type === "cpu") {
    return "white";
  }

  return null;
}
