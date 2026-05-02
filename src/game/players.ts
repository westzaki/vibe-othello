import type { DiscColor } from "./othello";

export type CpuLevel = "level1" | "level2";
export type PlayerType = "human" | "cpu";
export type PlayerConfig = {
  cpuLevel: CpuLevel;
  type: PlayerType;
};
export type PlayerSettings = Record<DiscColor, PlayerConfig>;

export function createDefaultPlayerSettings(): PlayerSettings {
  return {
    black: {
      cpuLevel: "level1",
      type: "human",
    },
    white: {
      cpuLevel: "level1",
      type: "human",
    },
  };
}
