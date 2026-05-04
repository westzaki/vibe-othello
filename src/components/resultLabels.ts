import type { Winner } from "../game/othello";
import type { PlayerSettings } from "../game/players";

export function getResultTitle(
  winner: Winner,
  players: PlayerSettings,
): string {
  if (winner === "draw") {
    return "引き分け";
  }

  const humanDisc = getSingleHumanDisc(players);

  if (humanDisc !== null) {
    return winner === humanDisc ? "あなたの勝ち" : "あなたの負け";
  }

  return `${winner === "black" ? "黒" : "白"}の勝ち`;
}

function getSingleHumanDisc(players: PlayerSettings): "black" | "white" | null {
  const blackIsHuman = players.black.type === "human";
  const whiteIsHuman = players.white.type === "human";

  if (blackIsHuman === whiteIsHuman) {
    return null;
  }

  return blackIsHuman ? "black" : "white";
}
