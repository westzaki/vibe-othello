import type { DiscColor, Winner } from "../../game/othello";
import type { PlayerSettings } from "../../game/players";
import type { ReviewOutcome } from "../../teacher";

export function getReviewedDisc(players: PlayerSettings): DiscColor | null {
  if (players.black.type === "human" && players.white.type === "cpu") {
    return "black";
  }

  if (players.white.type === "human" && players.black.type === "cpu") {
    return "white";
  }

  return null;
}

export function getReviewOutcome(
  reviewedDisc: DiscColor | null,
  winner: Winner | null,
): ReviewOutcome | null {
  if (reviewedDisc === null || winner === null) {
    return null;
  }

  if (winner === "draw") {
    return "draw";
  }

  return winner === reviewedDisc ? "win" : "loss";
}
