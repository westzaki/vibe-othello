import { useEffect, useMemo, useState } from "react";
import { defaultTeacherReviewConfig } from "../teacher";
import {
  createErrorGameReviewModel,
  createGameReviewModelFromReview,
  createLoadingGameReviewModel,
  createUnavailableGameReviewModel,
  type GameReviewModel,
  type GameReviewModelOptions,
} from "../services/gameReviewModel";
import { getReviewedDisc, getReviewOutcome } from "../services/reviewPlayers";
import { reviewGameAsync } from "../services/reviewService";
import type { GameReview } from "../teacher";

export type UseGameReviewOptions = GameReviewModelOptions;

type ReviewRequestSources = Pick<
  GameReviewModelOptions,
  "moveHistory" | "players" | "winner"
>;

type ReviewRequestState =
  | ({ requestId: string | null; review: null; status: "idle" } & Partial<
      ReviewRequestSources
    >)
  | ({
      requestId: string;
      review: GameReview;
      status: "ready";
    } & ReviewRequestSources)
  | ({
      errorMessage: string;
      requestId: string;
      review: null;
      status: "error";
    } & ReviewRequestSources);

let nextReviewRequestId = 0;

export function useGameReview(options: UseGameReviewOptions): GameReviewModel {
  const { currentMoveNumber, moveHistory, players, winner } = options;
  const reviewedDisc = getReviewedDisc(players);
  const reviewOutcome = getReviewOutcome(reviewedDisc, winner);
  const [requestState, setRequestState] = useState<ReviewRequestState>({
    requestId: null,
    review: null,
    status: "idle",
  });

  useEffect(() => {
    if (reviewedDisc === null || reviewOutcome === null) {
      return;
    }

    let cancelled = false;
    const requestId = `review-${nextReviewRequestId}`;
    nextReviewRequestId += 1;

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

        setRequestState({
          moveHistory,
          players,
          requestId,
          review: response.review,
          status: "ready",
          winner,
        });
      },
      (error: unknown) => {
        if (cancelled) {
          return;
        }

        setRequestState({
          errorMessage:
            error instanceof Error ? error.message : "Review failed",
          moveHistory,
          players,
          requestId,
          review: null,
          status: "error",
          winner,
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [moveHistory, players, reviewedDisc, reviewOutcome, winner]);

  return useMemo(
    () => {
      const modelOptions = {
        currentMoveNumber,
        moveHistory,
        players,
        winner,
      };

      if (reviewedDisc === null || reviewOutcome === null) {
        return createUnavailableGameReviewModel(modelOptions);
      }

      if (
        isCurrentRequestState(requestState, { moveHistory, players, winner })
      ) {
        if (requestState.status === "ready") {
          return createGameReviewModelFromReview({
            ...modelOptions,
            review: requestState.review,
          });
        }

        if (requestState.status === "error") {
          return createErrorGameReviewModel(
            modelOptions,
            requestState.errorMessage,
          );
        }
      }

      return createLoadingGameReviewModel(modelOptions);
    },
    [
      currentMoveNumber,
      moveHistory,
      players,
      requestState,
      reviewedDisc,
      reviewOutcome,
      winner,
    ],
  );
}

function isCurrentRequestState(
  requestState: ReviewRequestState,
  { moveHistory, players, winner }: ReviewRequestSources,
): requestState is Extract<
  ReviewRequestState,
  { status: "error" | "ready" }
> {
  return (
    requestState.status !== "idle" &&
    requestState.moveHistory === moveHistory &&
    requestState.players === players &&
    requestState.winner === winner
  );
}
