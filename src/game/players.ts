import type { CpuLevel } from "../cpu/cpuLevels";
import type { DiscColor } from "./othello";

export type PlayerType = "human" | "cpu";
export type PlayerConfig = {
  cpuLevel: CpuLevel;
  type: PlayerType;
};
export type PlayerSettings = Record<DiscColor, PlayerConfig>;

export const discColors = ["black", "white"] as const satisfies DiscColor[];
export const playerTypes = ["human", "cpu"] as const satisfies PlayerType[];

export const playerTypeLabels: Record<PlayerType, string> = {
  cpu: "CPU",
  human: "Human",
};

export function createDefaultPlayerSettings(): PlayerSettings {
  return {
    black: {
      cpuLevel: "level1",
      type: "human",
    },
    white: {
      cpuLevel: "level1",
      type: "cpu",
    },
  };
}
