import { describe, expect, it } from "vitest";
import type { DiscColor } from "../game/othello";
import {
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  type GameSession,
} from "../game/session";
import { reviewGame } from "./reviewGame";
import type { GameReview } from "./reviewTypes";

const reviewWorkerTimeoutBudgetMs = 3000;

describe("teacher review performance", () => {
  it("reviews a full deterministic game within the worker timeout budget", () => {
    const session = playDeterministicGame();
    const startedAt = performance.now();
    const blackReview = reviewGame(session.moveHistory, {
      reviewedDisc: "black",
    });
    const whiteReview = reviewGame(session.moveHistory, {
      reviewedDisc: "white",
    });
    const durationMs = performance.now() - startedAt;

    expect(session.status).toBe("ended");
    expect(session.moveHistory.length).toBeGreaterThan(50);
    expect(hasExactEndgameReview(blackReview, "black")).toBe(true);
    expect(hasExactEndgameReview(whiteReview, "white")).toBe(true);
    expect(durationMs).toBeLessThan(reviewWorkerTimeoutBudgetMs);
  });
});

function playDeterministicGame(): GameSession {
  let session = startNewGame();

  while (session.status === "playing") {
    const legalMoves = getSessionLegalMoves(session);
    const nextMove = legalMoves[0];

    if (nextMove === undefined) {
      throw new Error("Expected the current player to have a legal move.");
    }

    session = placeCurrentDisc(session, nextMove).session;
  }

  return session;
}

function hasExactEndgameReview(
  review: GameReview,
  disc: DiscColor,
): boolean {
  return review.reviewedMoves.some(
    (move) =>
      move.disc === disc && move.review.evaluationSource === "exactEndgame",
  );
}
