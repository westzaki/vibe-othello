import { useMemo } from "react";
import type { PracticeSessionOptions } from "../game/session";
import type { OthelloGameController } from "../hooks/useOthelloGame";
import {
  createGameReviewMessages,
  createPracticeFeedbackContext,
  createReviewLesson,
  defaultTeacherReviewConfig,
  reviewGame,
  type PracticeFeedbackContext,
  type ReviewedMove,
} from "../teacher";
import { ReviewMoveSection } from "./review/ReviewMoveSection";
import {
  getPracticeActionMove,
  getReviewCardMoves,
} from "./review/reviewLessonDisplay";
import { ReviewPlaybackPanel } from "./review/ReviewPlaybackPanel";
import {
  clampMoveNumber,
  createPlaybackBoards,
  createPracticeOptionsFromMoveNumber,
  createReviewPlaybackDisplay,
} from "./review/reviewPlayback";
import { getReviewedDisc } from "./review/reviewPlayers";

type ReviewScreenProps = {
  currentMoveNumber: number;
  game: OthelloGameController;
  onBackToResult: () => void;
  onBackToStart: () => void;
  onMoveNumberChange: (moveNumber: number) => void;
  onStartPractice: (
    options: PracticeSessionOptions,
    feedbackContext?: PracticeFeedbackContext | null,
  ) => void;
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
  const safeMoveNumber = clampMoveNumber(currentMoveNumber, maxMoveNumber);
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
  const lesson = useMemo(
    () => (review === null ? null : createReviewLesson(review)),
    [review],
  );
  const selectableMoves = useMemo(() => {
    if (lesson === null) {
      return [];
    }

    const movesByNumber = new Map(
      lesson.cards
        .map((card) => card.move)
        .filter((move) => move !== null)
        .map((move) => [move.moveNumber, move]),
    );

    return [...movesByNumber.values()].sort(
      (first, second) => first.moveNumber - second.moveNumber,
    );
  }, [lesson]);
  const activeReviewedMove =
    selectableMoves.find((move) => move.moveNumber === safeMoveNumber) ?? null;
  const displayedReviewedMove =
    activeReviewedMove ??
    lesson?.turningPointCandidate ??
    lesson?.niceMove ??
    null;
  const displayedMoveNumber =
    displayedReviewedMove?.moveNumber ?? safeMoveNumber;
  const playbackDisplay = useMemo(
    () =>
      createReviewPlaybackDisplay(
        game.moveHistory,
        playbackBoards,
        displayedMoveNumber,
        displayedReviewedMove,
      ),
    [
      displayedMoveNumber,
      displayedReviewedMove,
      game.moveHistory,
      playbackBoards,
    ],
  );

  function goToMove(moveNumber: number) {
    onMoveNumberChange(clampMoveNumber(moveNumber, maxMoveNumber));
  }

  function startPracticeFromMove(move: ReviewedMove) {
    onStartPractice(
      createPracticeOptionsFromMoveNumber(
        game.moveHistory,
        playbackBoards,
        move.moveNumber,
      ),
      createPracticeFeedbackContext(move),
    );
  }

  return (
    <section className="review-screen" aria-labelledby="review-title">
      <div className="review-panel">
        <p className="eyebrow">Teacher Review</p>
        <h1 id="review-title">ふりかえり</h1>

        {review === null || messages === null || lesson === null ? (
          <p className="review-panel__status">
            ふたり対戦のふりかえりは、今はお休み中です
          </p>
        ) : (
          <div className="review-layout">
            <ReviewPlaybackPanel
              currentBoard={playbackDisplay.board}
              currentMove={playbackDisplay.currentMove}
              currentMoveNumber={playbackDisplay.currentMoveNumber}
              mode={playbackDisplay.mode}
              positionReview={playbackDisplay.positionReview}
            />

            <div className="review-summary">
              {lesson.cards.map((card) => {
                const practiceActionMove = getPracticeActionMove(card);

                return (
                  <ReviewMoveSection
                    key={card.kind}
                    actionLabel={card.actionLabel}
                    bodyText={card.bodyText}
                    emptyText={card.emptyText}
                    footerText={card.footerText}
                    messages={messages}
                    moves={getReviewCardMoves(card)}
                    onAction={
                      practiceActionMove === null ||
                      card.actionLabel === undefined
                        ? undefined
                        : () => startPracticeFromMove(practiceActionMove)
                    }
                    onSelectMove={goToMove}
                    selectedMoveNumber={
                      displayedReviewedMove?.moveNumber ?? null
                    }
                    showComparison={card.kind === "turningPoint"}
                    title={card.title}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="game-actions review-panel__actions">
          <button
            className="game-action game-action--primary"
            onClick={onBackToResult}
            type="button"
          >
            結果に戻る
          </button>
          <button className="game-action" onClick={onBackToStart} type="button">
            タイトルへ
          </button>
        </div>
      </div>
    </section>
  );
}
