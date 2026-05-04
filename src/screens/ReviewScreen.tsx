import { useMemo } from "react";
import { createInitialBoard } from "../game/othello";
import type { PracticeSessionOptions } from "../game/session";
import type { OthelloGameController } from "../hooks/useOthelloGame";
import {
  createGameReviewMessages,
  createReviewLesson,
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
import { getReviewedDisc } from "./review/reviewPlayers";

type ReviewScreenProps = {
  currentMoveNumber: number;
  game: OthelloGameController;
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
  const safeMoveNumber = clampMoveNumber(currentMoveNumber, maxMoveNumber);
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

  function goToMove(moveNumber: number) {
    onMoveNumberChange(clampMoveNumber(moveNumber, maxMoveNumber));
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

        {review === null || messages === null || lesson === null ? (
          <p className="review-panel__status">
            ふたり対戦のふりかえりは、今はお休み中です
          </p>
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
              {lesson.cards.map((card) => (
                <ReviewMoveSection
                  key={card.kind}
                  bodyText={card.bodyText}
                  emptyText={card.emptyText}
                  footerText={
                    card.kind === "practiceTarget" ? messages.advice : undefined
                  }
                  messages={messages}
                  moves={card.move === null ? [] : [card.move]}
                  onSelectMove={goToMove}
                  selectedMoveNumber={activeReviewedMove?.moveNumber ?? null}
                  title={card.title}
                />
              ))}
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
