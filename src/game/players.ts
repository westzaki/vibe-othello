import type { DiscColor } from "./othello";

export type CpuLevel =
  | "level1"
  | "level2"
  | "level3"
  | "level4"
  | "level5"
  | "level6";
export type PlayerType = "human" | "cpu";
export type PlayerConfig = {
  cpuLevel: CpuLevel;
  type: PlayerType;
};
export type PlayerSettings = Record<DiscColor, PlayerConfig>;

export const discColors = ["black", "white"] as const satisfies DiscColor[];
export const playerTypes = ["human", "cpu"] as const satisfies PlayerType[];
export const cpuLevels = [
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
  "level6",
] as const satisfies CpuLevel[];

export const cpuLevelLabels: Record<CpuLevel, string> = {
  level1: "Beginner",
  level2: "Casual",
  level3: "Normal",
  level4: "Expert",
  level5: "Master",
  level6: "Grandmaster",
};

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
      type: "human",
    },
  };
}
