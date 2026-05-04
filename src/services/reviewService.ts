import type { MoveRecord } from "../game/session";
import { reviewGame } from "../teacher";
import type { GameReview, ReviewGameOptions } from "../teacher";

export type ReviewGameRequest = {
  moveHistory: MoveRecord[];
  options: ReviewGameOptions;
  requestId: string;
};

export type ReviewGameResponse = {
  requestId: string;
  review: GameReview;
};

export async function reviewGameAsync(
  request: ReviewGameRequest,
): Promise<ReviewGameResponse> {
  return {
    requestId: request.requestId,
    review: reviewGame(request.moveHistory, request.options),
  };
}
