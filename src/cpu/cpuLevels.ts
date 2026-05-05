export type CpuLevel = keyof typeof cpuLevelDefinitions;

export type CpuLevelRuntime = "sync" | "worker";

export type CpuLevelDefinition = {
  label: string;
  runtime: CpuLevelRuntime;
};

export const cpuLevelDefinitions = {
  level1: {
    label: "Beginner",
    runtime: "sync",
  },
  level2: {
    label: "Casual",
    runtime: "sync",
  },
  level3: {
    label: "Normal",
    runtime: "sync",
  },
  level4: {
    label: "Expert",
    runtime: "sync",
  },
  level5: {
    label: "Master",
    runtime: "sync",
  },
  level6: {
    label: "Grandmaster",
    runtime: "worker",
  },
} as const satisfies Record<string, CpuLevelDefinition>;

export const cpuLevels = [
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
  "level6",
] as const satisfies CpuLevel[];

export const cpuLevelLabels = Object.fromEntries(
  cpuLevels.map((level) => [level, cpuLevelDefinitions[level].label]),
) as Record<CpuLevel, string>;

export function getCpuLevelDefinition(
  level: CpuLevel,
): CpuLevelDefinition {
  return cpuLevelDefinitions[level];
}

export function usesCpuMoveWorker(level: CpuLevel): boolean {
  return getCpuLevelDefinition(level).runtime === "worker";
}
