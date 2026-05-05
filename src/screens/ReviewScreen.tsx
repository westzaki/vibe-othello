import type { PracticeSessionOptions } from "../game/session";
import { useGameReview } from "../hooks/useGameReview";
import type { OthelloGameController } from "../hooks/useOthelloGame";
import {
  createPracticeFeedbackContext,
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
  createPracticeOptionsFromMoveNumber,
} from "../services/reviewPlaybackModel";

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
  const reviewModel = useGameReview({
    currentMoveNumber,
    moveHistory: game.moveHistory,
    players: game.players,
    winner: game.winner,
  });

  function goToMove(moveNumber: number) {
    onMoveNumberChange(clampMoveNumber(moveNumber, reviewModel.maxMoveNumber));
  }

  function startPracticeFromMove(move: ReviewedMove) {
    onStartPractice(
      createPracticeOptionsFromMoveNumber(
        game.moveHistory,
        reviewModel.playbackBoards,
        move.moveNumber,
      ),
      createPracticeFeedbackContext(move),
    );
  }

  return (
    <section className="review-screen" aria-labelledby="review-title">
      <div className="review-panel">
        <div className="review-panel__header">
          <p className="eyebrow">対局のあと</p>
          <h1 id="review-title">ふりかえり</h1>
          <p>気になった局面だけを見て、次の一手を試してみよう。</p>
        </div>

        {reviewModel.status === "unavailable" ? (
          <p className="review-panel__status">
            ふたり対戦のふりかえりは、今はお休み中です。1人でCPUと遊んだあとに、コーチがポイントを見つけるよ。
          </p>
        ) : reviewModel.status === "loading" ? (
          <p className="review-panel__status" role="status">
            ふりかえりを準備中です…
          </p>
        ) : reviewModel.status === "error" ? (
          <p className="review-panel__status" role="alert">
            ふりかえりを作れませんでした。結果画面に戻って、もう一度試してみてください。
          </p>
        ) : (
          <div className="review-layout">
            <ReviewPlaybackPanel
              currentBoard={reviewModel.playbackDisplay.board}
              currentMove={reviewModel.playbackDisplay.currentMove}
              currentMoveNumber={reviewModel.playbackDisplay.currentMoveNumber}
              mode={reviewModel.playbackDisplay.mode}
              positionReview={reviewModel.playbackDisplay.positionReview}
            />

            <div className="review-summary">
              {reviewModel.lesson.cards.map((card) => {
                const practiceActionMove = getPracticeActionMove(card);

                return (
                  <ReviewMoveSection
                    key={card.kind}
                    actionLabel={card.actionLabel}
                    bodyText={card.bodyText}
                    emptyText={card.emptyText}
                    footerText={card.footerText}
                    messages={reviewModel.messages}
                    moves={getReviewCardMoves(card)}
                    onAction={
                      practiceActionMove === null ||
                      card.actionLabel === undefined
                        ? undefined
                        : () => startPracticeFromMove(practiceActionMove)
                    }
                    onSelectMove={goToMove}
                    selectedMoveNumber={
                      reviewModel.displayedReviewedMove?.moveNumber ?? null
                    }
                    showComparison={card.kind === "turningPoint"}
                    title={card.title}
                    tone={card.kind}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="game-actions review-panel__actions">
          <button
            className="game-action review-panel__nav-action"
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
