import type { MoveRecord } from "../../game/session";
import type { GameReview, ReviewGameOptions } from "../../teacher";

export type ReviewWorkerRequest = {
  moveHistory: MoveRecord[];
  options: ReviewGameOptions;
  requestId: number;
  type: "reviewGame";
};

export type ReviewWorkerResponse =
  | {
      requestId: number;
      review: GameReview;
      type: "gameReviewed";
    }
  | {
      message: string;
      requestId: number;
      type: "reviewError";
    };
