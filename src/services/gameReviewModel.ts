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
import { createLightweightReviewGameOptions } from "./reviewFallback";

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

export type LoadingGameReviewModel = GameReviewModelBase & {
  lesson: null;
  messages: null;
  review: null;
  status: "loading";
};

export type ErrorGameReviewModel = GameReviewModelBase & {
  errorMessage: string;
  lesson: null;
  messages: null;
  review: null;
  status: "error";
};

export type ReadyGameReviewModel = GameReviewModelBase & {
  lesson: ReviewLesson;
  messages: GameReviewMessages;
  review: GameReview;
  reviewedDisc: DiscColor;
  status: "ready";
};

export type GameReviewModel =
  | ErrorGameReviewModel
  | LoadingGameReviewModel
  | ReadyGameReviewModel
  | UnavailableGameReviewModel;

export function createGameReviewModel({
  currentMoveNumber,
  moveHistory,
  players,
  winner,
}: GameReviewModelOptions): GameReviewModel {
  const base = createGameReviewModelBase({
    currentMoveNumber,
    moveHistory,
    players,
    winner,
  });

  if (base.reviewedDisc === null || base.reviewOutcome === null) {
    return createUnavailableGameReviewModelFromBase(base);
  }

  const review = reviewGame(
    moveHistory,
    createLightweightReviewGameOptions({
      reviewedDisc: base.reviewedDisc,
      ...defaultTeacherReviewConfig,
    }),
  );

  return createGameReviewModelFromReview({
    currentMoveNumber,
    moveHistory,
    players,
    review,
    winner,
  });
}

export function createGameReviewModelFromReview({
  currentMoveNumber,
  moveHistory,
  players,
  review,
  winner,
}: GameReviewModelOptions & { review: GameReview }): GameReviewModel {
  const base = createGameReviewModelBase({
    currentMoveNumber,
    moveHistory,
    players,
    winner,
  });

  if (base.reviewedDisc === null || base.reviewOutcome === null) {
    return createUnavailableGameReviewModelFromBase(base);
  }

  const messages = createGameReviewMessages(review);
  const lesson = createReviewLesson(review, base.reviewOutcome);
  const selectableMoves = getSelectableReviewMoves(lesson);
  const displayedReviewedMove = getDisplayedReviewedMove(
    lesson,
    base.safeMoveNumber,
    selectableMoves,
  );
  const displayedMoveNumber =
    displayedReviewedMove?.moveNumber ?? base.safeMoveNumber;
  const playbackDisplay = createReviewPlaybackDisplay(
    moveHistory,
    base.playbackBoards,
    displayedMoveNumber,
    displayedReviewedMove,
  );

  return {
    displayedMoveNumber,
    displayedReviewedMove,
    lesson,
    maxMoveNumber: base.maxMoveNumber,
    messages,
    playbackBoards: base.playbackBoards,
    playbackDisplay,
    review,
    reviewedDisc: base.reviewedDisc,
    safeMoveNumber: base.safeMoveNumber,
    selectableMoves,
    status: "ready",
  };
}

export function createLoadingGameReviewModel(
  options: GameReviewModelOptions,
): GameReviewModel {
  const base = createGameReviewModelBase(options);

  if (base.reviewedDisc === null || base.reviewOutcome === null) {
    return createUnavailableGameReviewModelFromBase(base);
  }

  return createLoadingGameReviewModelFromBase(base);
}

export function createUnavailableGameReviewModel(
  options: GameReviewModelOptions,
): UnavailableGameReviewModel {
  return createUnavailableGameReviewModelFromBase(
    createGameReviewModelBase(options),
  );
}

export function createErrorGameReviewModel(
  options: GameReviewModelOptions,
  errorMessage: string,
): GameReviewModel {
  const base = createGameReviewModelBase(options);

  if (base.reviewedDisc === null || base.reviewOutcome === null) {
    return createUnavailableGameReviewModelFromBase(base);
  }

  return {
    errorMessage,
    lesson: null,
    messages: null,
    review: null,
    ...base,
    status: "error",
  };
}

function createGameReviewModelBase({
  currentMoveNumber,
  moveHistory,
  players,
  winner,
}: GameReviewModelOptions): GameReviewModelBase & {
  reviewOutcome: ReturnType<typeof getReviewOutcome>;
} {
  const reviewedDisc = getReviewedDisc(players);
  const reviewOutcome = getReviewOutcome(reviewedDisc, winner);
  const playbackBoards = createPlaybackBoards(moveHistory);
  const maxMoveNumber = playbackBoards.length - 1;
  const safeMoveNumber = clampMoveNumber(currentMoveNumber, maxMoveNumber);
  const playbackDisplay = createReviewPlaybackDisplay(
    moveHistory,
    playbackBoards,
    safeMoveNumber,
    null,
  );

  return {
    displayedMoveNumber: safeMoveNumber,
    displayedReviewedMove: null,
    maxMoveNumber,
    playbackBoards,
    playbackDisplay,
    reviewedDisc,
    reviewOutcome,
    safeMoveNumber,
    selectableMoves: [],
  };
}

function createUnavailableGameReviewModelFromBase(
  base: GameReviewModelBase,
): UnavailableGameReviewModel {
  return {
    ...base,
    lesson: null,
    messages: null,
    review: null,
    status: "unavailable",
  };
}

function createLoadingGameReviewModelFromBase(
  base: GameReviewModelBase,
): LoadingGameReviewModel {
  return {
    ...base,
    lesson: null,
    messages: null,
    review: null,
    status: "loading",
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
