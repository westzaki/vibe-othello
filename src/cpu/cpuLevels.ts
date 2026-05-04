export type CpuLevel =
  | "level1"
  | "level2"
  | "level3"
  | "level4"
  | "level5"
  | "level6";

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
