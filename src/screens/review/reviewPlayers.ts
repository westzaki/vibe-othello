import type { DiscColor } from "../../game/othello";
import type { PlayerSettings } from "../../game/players";

export function getReviewedDisc(players: PlayerSettings): DiscColor | null {
  if (players.black.type === "human" && players.white.type === "cpu") {
    return "black";
  }

  if (players.white.type === "human" && players.black.type === "cpu") {
    return "white";
  }

  return null;
}
