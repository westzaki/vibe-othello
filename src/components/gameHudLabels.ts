import type { Advantage } from "../cpu";
import type { DiscColor } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import type {
  PlayPositionAnalysis,
  PlayPositionShapeSignalKind,
} from "../teacher";

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
  if (advantage.leadingDisc === null) {
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

type AdvantageContextSources = Pick<
  PlayPositionAnalysis,
  "confidenceReason" | "shapeSignals"
>;

const shapeSignalPriority: PlayPositionShapeSignalKind[] = [
  "cornerRisk",
  "cornerOpportunity",
  "mobilityRisk",
  "mobilityOpportunity",
  "endgame",
];

export function getAdvantageContextLabel(
  analysis: AdvantageContextSources,
): string {
  if (analysis.confidenceReason === "finalBoard") {
    return "最終盤面";
  }

  if (analysis.confidenceReason === "exactEndgame") {
    return "終盤読み";
  }

  if (analysis.confidenceReason === "noLegalMoves") {
    return "置ける手なし";
  }

  const primarySignalKind = shapeSignalPriority.find((kind) =>
    analysis.shapeSignals.some((signal) => signal.kind === kind),
  );

  if (primarySignalKind !== undefined) {
    return getShapeSignalLabel(primarySignalKind);
  }

  return "形から見た目安";
}

function getShapeSignalLabel(kind: PlayPositionShapeSignalKind): string {
  switch (kind) {
    case "cornerOpportunity":
      return "角チャンス";
    case "cornerRisk":
      return "角に注意";
    case "endgame":
      return "終盤読み";
    case "mobilityOpportunity":
      return "相手が動きづらい";
    case "mobilityRisk":
      return "行き先に注意";
  }
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
