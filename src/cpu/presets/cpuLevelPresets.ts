import {
  getCpuLevelDefinition,
  type CpuLevel,
  type CpuLevelRuntime,
} from "../cpuLevels";
import { chooseCornerMove } from "../strategies/cornerStrategy";
import { chooseGrandmasterMove } from "../strategies/grandmasterStrategy";
import { chooseFixedDepthMinimaxMove } from "../strategies/minimaxStrategy";
import { chooseOnePlyMove } from "../strategies/onePlyStrategy";
import { chooseRandomMove } from "../strategies/randomStrategy";
import { chooseStrategicMove } from "../strategies/strategicStrategy";
import type { CpuMoveStrategy } from "../strategies/types";

export type CpuLevelPreset = {
  chooseMove: CpuMoveStrategy;
  label: string;
  level: CpuLevel;
  runtime: CpuLevelRuntime;
};

export const cpuLevelPresets: Record<CpuLevel, CpuLevelPreset> = {
  level1: {
    ...getCpuLevelDefinition("level1"),
    level: "level1",
    chooseMove: chooseRandomMove,
  },
  level2: {
    ...getCpuLevelDefinition("level2"),
    level: "level2",
    chooseMove: chooseCornerMove,
  },
  level3: {
    ...getCpuLevelDefinition("level3"),
    level: "level3",
    chooseMove: chooseOnePlyMove,
  },
  level4: {
    ...getCpuLevelDefinition("level4"),
    level: "level4",
    chooseMove: chooseStrategicMove,
  },
  level5: {
    ...getCpuLevelDefinition("level5"),
    level: "level5",
    chooseMove: (board, disc) => chooseFixedDepthMinimaxMove(board, disc, 4),
  },
  level6: {
    ...getCpuLevelDefinition("level6"),
    level: "level6",
    chooseMove: chooseGrandmasterMove,
  },
};

export function getCpuLevelPreset(level: CpuLevel): CpuLevelPreset {
  return cpuLevelPresets[level];
}
