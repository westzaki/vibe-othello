import { useMemo } from "react";
import {
  createGameReviewModel,
  type GameReviewModel,
  type GameReviewModelOptions,
} from "../services/gameReviewModel";

export type UseGameReviewOptions = GameReviewModelOptions;

export function useGameReview(options: UseGameReviewOptions): GameReviewModel {
  const { currentMoveNumber, moveHistory, players, winner } = options;

  return useMemo(
    () =>
      createGameReviewModel({
        currentMoveNumber,
        moveHistory,
        players,
        winner,
      }),
    [currentMoveNumber, moveHistory, players, winner],
  );
}
