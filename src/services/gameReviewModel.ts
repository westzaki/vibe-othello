import type { Board, DiscColor, Winner } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import type { MoveRecord } from "../game/session";
import {
  clampMoveNumber,
  createPlaybackBoards,
  createReviewPlaybackDisplay,
  type ReviewPlaybackDisplay,
} from "./reviewPlaybackModel";
import { getReviewedDisc, getReviewOutcome } from "./reviewPlayers";
import {
  createGameReviewMessages,
  createReviewLesson,
  defaultTeacherReviewConfig,
  reviewGame,
  type GameReview,
  type GameReviewMessages,
  type ReviewedMove,
  type ReviewLesson,
} from "../teacher";

export type GameReviewModelOptions = {
  currentMoveNumber: number;
  moveHistory: MoveRecord[];
  players: PlayerSettings;
  winner: Winner | null;
};

type GameReviewModelBase = {
  displayedMoveNumber: number;
  displayedReviewedMove: ReviewedMove | null;
  maxMoveNumber: number;
  playbackBoards: Board[];
  playbackDisplay: ReviewPlaybackDisplay;
  reviewedDisc: DiscColor | null;
  safeMoveNumber: number;
  selectableMoves: ReviewedMove[];
};

export type UnavailableGameReviewModel = GameReviewModelBase & {
  lesson: null;
  messages: null;
  review: null;
  status: "unavailable";
};

export type ReadyGameReviewModel = GameReviewModelBase & {
  lesson: ReviewLesson;
  messages: GameReviewMessages;
  review: GameReview;
  reviewedDisc: DiscColor;
  status: "ready";
};

export type GameReviewModel =
  | ReadyGameReviewModel
  | UnavailableGameReviewModel;

export function createGameReviewModel({
  currentMoveNumber,
  moveHistory,
  players,
  winner,
}: GameReviewModelOptions): GameReviewModel {
  const reviewedDisc = getReviewedDisc(players);
  const reviewOutcome = getReviewOutcome(reviewedDisc, winner);
  const playbackBoards = createPlaybackBoards(moveHistory);
  const maxMoveNumber = playbackBoards.length - 1;
  const safeMoveNumber = clampMoveNumber(currentMoveNumber, maxMoveNumber);

  if (reviewedDisc === null || reviewOutcome === null) {
    return createUnavailableGameReviewModel({
      maxMoveNumber,
      moveHistory,
      playbackBoards,
      reviewedDisc,
      safeMoveNumber,
    });
  }

  const review = reviewGame(moveHistory, {
    reviewedDisc,
    ...defaultTeacherReviewConfig,
  });
  const messages = createGameReviewMessages(review);
  const lesson = createReviewLesson(review, reviewOutcome);
  const selectableMoves = getSelectableReviewMoves(lesson);
  const displayedReviewedMove = getDisplayedReviewedMove(
    lesson,
    safeMoveNumber,
    selectableMoves,
  );
  const displayedMoveNumber =
    displayedReviewedMove?.moveNumber ?? safeMoveNumber;
  const playbackDisplay = createReviewPlaybackDisplay(
    moveHistory,
    playbackBoards,
    displayedMoveNumber,
    displayedReviewedMove,
  );

  return {
    displayedMoveNumber,
    displayedReviewedMove,
    lesson,
    maxMoveNumber,
    messages,
    playbackBoards,
    playbackDisplay,
    review,
    reviewedDisc,
    safeMoveNumber,
    selectableMoves,
    status: "ready",
  };
}

function createUnavailableGameReviewModel({
  maxMoveNumber,
  moveHistory,
  playbackBoards,
  reviewedDisc,
  safeMoveNumber,
}: {
  maxMoveNumber: number;
  moveHistory: MoveRecord[];
  playbackBoards: Board[];
  reviewedDisc: DiscColor | null;
  safeMoveNumber: number;
}): UnavailableGameReviewModel {
  const playbackDisplay = createReviewPlaybackDisplay(
    moveHistory,
    playbackBoards,
    safeMoveNumber,
    null,
  );

  return {
    displayedMoveNumber: safeMoveNumber,
    displayedReviewedMove: null,
    lesson: null,
    maxMoveNumber,
    messages: null,
    playbackBoards,
    playbackDisplay,
    review: null,
    reviewedDisc,
    safeMoveNumber,
    selectableMoves: [],
    status: "unavailable",
  };
}

function getSelectableReviewMoves(lesson: ReviewLesson): ReviewedMove[] {
  const movesByNumber = new Map(
    lesson.cards
      .map((card) => card.move)
      .filter((move) => move !== null)
      .map((move) => [move.moveNumber, move]),
  );

  return [...movesByNumber.values()].sort(
    (first, second) => first.moveNumber - second.moveNumber,
  );
}

function getDisplayedReviewedMove(
  lesson: ReviewLesson,
  safeMoveNumber: number,
  selectableMoves: ReviewedMove[],
): ReviewedMove | null {
  return (
    selectableMoves.find((move) => move.moveNumber === safeMoveNumber) ??
    lesson.turningPointCandidate ??
    lesson.niceMove ??
    null
  );
}
