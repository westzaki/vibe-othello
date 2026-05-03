import { useMemo } from "react";
import { ReviewBoard } from "../components/ReviewBoard";
import { getMinimaxMoveScores } from "../cpu";
import {
  createInitialBoard,
  getLegalMoves,
  getNextDisc,
  isGameOver,
  type Board,
  type DiscColor,
  type SquareIndex,
} from "../game/othello";
import type { PlayerSettings } from "../game/players";
import type { MoveRecord, PracticeSessionOptions } from "../game/session";
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
    const practiceMoveNumber = safeMoveNumber === 0 ? 0 : safeMoveNumber - 1;
    const practiceBoard =
      playbackBoards[practiceMoveNumber] ?? createInitialBoard();
    const practiceLastMove =
      practiceMoveNumber === 0
        ? null
        : (game.moveHistory[practiceMoveNumber - 1]?.square ?? null);
    const nextDisc = getNextDiscForMoveNumber(
      game.moveHistory,
      practiceMoveNumber,
    );

    onStartPractice({
      board: practiceBoard,
      lastMove: practiceLastMove,
      nextDisc,
    });
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
            <section className="review-board-panel">
              <h2 className="review-summary__title">棋譜再生</h2>
              <ReviewPlaybackDetail
                currentMove={currentMove}
                currentMoveNumber={safeMoveNumber}
                maxMoveNumber={maxMoveNumber}
                positionReview={positionReview}
              />
              <ReviewBoard
                bestSquare={positionReview.bestSquare}
                board={currentBoard}
                legalMoves={positionReview.legalMoves}
                playedSquare={currentMove?.square ?? null}
              />
              <ReviewPlaybackControls
                currentMoveNumber={safeMoveNumber}
                maxMoveNumber={maxMoveNumber}
                onGoToMove={goToMove}
                onStartPractice={startPractice}
              />
              <ReviewLegend />
            </section>

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

type ReviewPlaybackDetailProps = {
  currentMove: MoveRecord | null;
  currentMoveNumber: number;
  maxMoveNumber: number;
  positionReview: PlaybackPositionReview;
};

function ReviewPlaybackDetail({
  currentMove,
  currentMoveNumber,
  maxMoveNumber,
  positionReview,
}: ReviewPlaybackDetailProps) {
  return (
    <dl className="review-detail">
      <div>
        <dt>手数</dt>
        <dd>
          {currentMoveNumber} / {maxMoveNumber}
        </dd>
      </div>
      <div>
        <dt>直前の手</dt>
        <dd>
          {currentMove === null ? "初期盤面" : formatSquare(currentMove.square)}
        </dd>
      </div>
      <div>
        <dt>おすすめ</dt>
        <dd>
          {positionReview.bestSquare === null
            ? "なし"
            : `${formatDisc(positionReview.disc)} ${formatSquare(
                positionReview.bestSquare,
              )}`}
        </dd>
      </div>
    </dl>
  );
}

type ReviewPlaybackControlsProps = {
  currentMoveNumber: number;
  maxMoveNumber: number;
  onGoToMove: (moveNumber: number) => void;
  onStartPractice: () => void;
};

function ReviewPlaybackControls({
  currentMoveNumber,
  maxMoveNumber,
  onGoToMove,
  onStartPractice,
}: ReviewPlaybackControlsProps) {
  return (
    <div className="review-playback-group">
      <div className="review-playback">
        <button
          className="game-action"
          disabled={currentMoveNumber === 0}
          onClick={() => onGoToMove(currentMoveNumber - 1)}
          type="button"
        >
          前へ
        </button>
        <span className="review-playback__status">{currentMoveNumber}手目</span>
        <button
          className="game-action"
          disabled={currentMoveNumber === maxMoveNumber}
          onClick={() => onGoToMove(currentMoveNumber + 1)}
          type="button"
        >
          次へ
        </button>
      </div>
      <button
        className="game-action game-action--primary review-playback__practice"
        onClick={onStartPractice}
        type="button"
      >
        {currentMoveNumber === 0 ? "初期盤面から練習" : "この手の前から練習"}
      </button>
    </div>
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

function createPlaybackBoards(moveHistory: MoveRecord[]): Board[] {
  return [
    moveHistory[0]?.boardBefore ?? createInitialBoard(),
    ...moveHistory.map((move) => move.boardAfter),
  ];
}

function clampMoveNumber(moveNumber: number, maxMoveNumber: number): number {
  return Math.max(0, Math.min(moveNumber, maxMoveNumber));
}

type PlaybackPositionReview = {
  bestSquare: SquareIndex | null;
  disc: DiscColor;
  legalMoves: SquareIndex[];
};

function createPlaybackPositionReview(
  board: Board,
  nextDisc: DiscColor,
): PlaybackPositionReview {
  if (isGameOver(board)) {
    return {
      bestSquare: null,
      disc: nextDisc,
      legalMoves: [],
    };
  }

  const nextDiscLegalMoves = getLegalMoves(board, nextDisc);
  const disc = nextDiscLegalMoves.length > 0 ? nextDisc : getNextDisc(nextDisc);
  const legalMoves =
    nextDiscLegalMoves.length > 0
      ? nextDiscLegalMoves
      : getLegalMoves(board, disc);
  const bestSquare =
    getMinimaxMoveScores(board, disc, {
      searchDepth: defaultTeacherReviewConfig.searchDepth,
    })[0]?.move ?? null;

  return {
    bestSquare,
    disc,
    legalMoves,
  };
}

function getNextDiscForMoveNumber(
  moveHistory: MoveRecord[],
  moveNumber: number,
): DiscColor {
  if (moveNumber === 0) {
    return "black";
  }

  const move = moveHistory[moveNumber - 1];

  return move === undefined ? "black" : getNextDisc(move.disc);
}

function formatSquare(square: SquareIndex): string {
  const column = String.fromCharCode("A".charCodeAt(0) + (square % 8));
  const row = Math.floor(square / 8) + 1;

  return `${column}${row}`;
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "黒" : "白";
}
