import type { PlayerSettings } from "../game/players";
import type { MoveRecord } from "../game/session";
import type { Winner } from "../game/othello";
import type { GameReview } from "../teacher";

export type GameReviewRequestSources = {
  moveHistory: MoveRecord[];
  players: PlayerSettings;
  winner: Winner | null;
};

export type StoredGameReviewRequestState =
  | { requestId: string | null; review: null; status: "idle" }
  | ({
      requestId: string;
      review: GameReview;
      status: "ready";
    } & GameReviewRequestSources)
  | ({
      errorMessage: string;
      requestId: string;
      review: null;
      status: "error";
    } & GameReviewRequestSources);

export type GameReviewAsyncState =
  | { status: "unavailable" }
  | { status: "loading" }
  | { review: GameReview; status: "ready" }
  | { errorMessage: string; status: "error" };

export function createIdleGameReviewRequestState(): StoredGameReviewRequestState {
  return {
    requestId: null,
    review: null,
    status: "idle",
  };
}

export function createReadyGameReviewRequestState(
  requestId: string,
  sources: GameReviewRequestSources,
  review: GameReview,
): StoredGameReviewRequestState {
  return {
    ...sources,
    requestId,
    review,
    status: "ready",
  };
}

export function createErrorGameReviewRequestState(
  requestId: string,
  sources: GameReviewRequestSources,
  errorMessage: string,
): StoredGameReviewRequestState {
  return {
    ...sources,
    errorMessage,
    requestId,
    review: null,
    status: "error",
  };
}

export function getCurrentGameReviewAsyncState(
  requestState: StoredGameReviewRequestState,
  sources: GameReviewRequestSources,
  isReviewAvailable: boolean,
): GameReviewAsyncState {
  if (!isReviewAvailable) {
    return { status: "unavailable" };
  }

  if (!isCurrentRequestState(requestState, sources)) {
    return { status: "loading" };
  }

  if (requestState.status === "ready") {
    return {
      review: requestState.review,
      status: "ready",
    };
  }

  if (requestState.status === "error") {
    return {
      errorMessage: requestState.errorMessage,
      status: "error",
    };
  }

  return { status: "loading" };
}

function isCurrentRequestState(
  requestState: StoredGameReviewRequestState,
  { moveHistory, players, winner }: GameReviewRequestSources,
): requestState is Extract<
  StoredGameReviewRequestState,
  { status: "error" | "ready" }
> {
  return (
    requestState.status !== "idle" &&
    requestState.moveHistory === moveHistory &&
    requestState.players === players &&
    requestState.winner === winner
  );
}
