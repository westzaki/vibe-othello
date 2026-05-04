import { useEffect, useMemo, useState } from "react";
import { defaultTeacherReviewConfig } from "../teacher";
import {
  createErrorGameReviewRequestState,
  createIdleGameReviewRequestState,
  createReadyGameReviewRequestState,
  getCurrentGameReviewAsyncState,
  type GameReviewAsyncState,
  type GameReviewRequestSources,
  type StoredGameReviewRequestState,
} from "../services/gameReviewAsyncState";
import { getReviewedDisc, getReviewOutcome } from "../services/reviewPlayers";
import { reviewGameAsync } from "../services/reviewService";

let nextReviewRequestId = 0;

export function useGameReviewRequest(
  sources: GameReviewRequestSources,
): GameReviewAsyncState {
  const { moveHistory, players, winner } = sources;
  const reviewedDisc = getReviewedDisc(players);
  const reviewOutcome = getReviewOutcome(reviewedDisc, winner);
  const isReviewAvailable = reviewedDisc !== null && reviewOutcome !== null;
  const [requestState, setRequestState] =
    useState<StoredGameReviewRequestState>(
      createIdleGameReviewRequestState,
    );

  useEffect(() => {
    if (reviewedDisc === null || reviewOutcome === null) {
      return;
    }

    let cancelled = false;
    const requestId = `review-${nextReviewRequestId}`;
    nextReviewRequestId += 1;
    const requestSources = {
      moveHistory,
      players,
      winner,
    };

    void reviewGameAsync({
      moveHistory,
      options: {
        reviewedDisc,
        ...defaultTeacherReviewConfig,
      },
      requestId,
    }).then(
      (response) => {
        if (cancelled || response.requestId !== requestId) {
          return;
        }

        setRequestState(
          createReadyGameReviewRequestState(
            requestId,
            requestSources,
            response.review,
          ),
        );
      },
      (error: unknown) => {
        if (cancelled) {
          return;
        }

        setRequestState(
          createErrorGameReviewRequestState(
            requestId,
            requestSources,
            error instanceof Error ? error.message : "Review failed",
          ),
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [moveHistory, players, reviewedDisc, reviewOutcome, winner]);

  return useMemo(
    () =>
      getCurrentGameReviewAsyncState(requestState, sources, isReviewAvailable),
    [isReviewAvailable, requestState, sources],
  );
}
