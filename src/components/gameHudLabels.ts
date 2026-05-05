import type { Advantage } from "../cpu";
import type { DiscColor } from "../game/othello";
import type { PlayerSettings } from "../game/players";

const advantageLeadPercentThreshold = 56;

export function getTurnLabel(
  currentDisc: DiscColor,
  isCpuThinking: boolean,
  players: PlayerSettings,
): string {
  const humanDisc = getSingleHumanDisc(players);

  if (humanDisc === null) {
    return `${formatDisc(currentDisc)}の番`;
  }

  if (currentDisc === humanDisc) {
    return "あなたの番";
  }

  return isCpuThinking ? "CPUが考え中" : "CPUの番";
}

export function getAdvantageLabel(
  advantage: Advantage,
  players: PlayerSettings,
): string {
  if (
    advantage.leadingDisc === null ||
    getLeadingPercent(advantage) < advantageLeadPercentThreshold
  ) {
    return "いい勝負";
  }

  const humanDisc = getSingleHumanDisc(players);

  if (humanDisc === null) {
    return `${formatDisc(advantage.leadingDisc)}が少しリード`;
  }

  return advantage.leadingDisc === humanDisc
    ? "あなたが少しリード"
    : "CPUが少しリード";
}

function getLeadingPercent(advantage: Advantage): number {
  return Math.max(advantage.blackPercent, advantage.whitePercent);
}

function getSingleHumanDisc(players: PlayerSettings): DiscColor | null {
  const blackIsHuman = players.black.type === "human";
  const whiteIsHuman = players.white.type === "human";

  if (blackIsHuman === whiteIsHuman) {
    return null;
  }

  return blackIsHuman ? "black" : "white";
}

function formatDisc(disc: DiscColor): string {
  return disc === "black" ? "黒" : "白";
}
