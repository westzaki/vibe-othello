import { useMemo } from "react";
import {
  createErrorGameReviewModel,
  createGameReviewModelFromReview,
  createLoadingGameReviewModel,
  createUnavailableGameReviewModel,
  type GameReviewModel,
  type GameReviewModelOptions,
} from "../services/gameReviewModel";
import { useGameReviewRequest } from "./useGameReviewRequest";

export type UseGameReviewOptions = GameReviewModelOptions;

export function useGameReview(options: UseGameReviewOptions): GameReviewModel {
  const { currentMoveNumber, moveHistory, players, winner } = options;
  const requestSources = useMemo(
    () => ({
      moveHistory,
      players,
      winner,
    }),
    [moveHistory, players, winner],
  );
  const reviewRequest = useGameReviewRequest(requestSources);

  return useMemo(
    () => {
      const modelOptions = {
        currentMoveNumber,
        moveHistory,
        players,
        winner,
      };

      if (reviewRequest.status === "unavailable") {
        return createUnavailableGameReviewModel(modelOptions);
      }

      if (reviewRequest.status === "ready") {
        return createGameReviewModelFromReview({
          ...modelOptions,
          review: reviewRequest.review,
        });
      }

      if (reviewRequest.status === "error") {
        return createErrorGameReviewModel(
          modelOptions,
          reviewRequest.errorMessage,
        );
      }

      return createLoadingGameReviewModel(modelOptions);
    },
    [
      currentMoveNumber,
      moveHistory,
      players,
      reviewRequest,
      winner,
    ],
  );
}
