import type { CpuLevel } from "../cpuLevels";
import { chooseCornerMove } from "../strategies/cornerStrategy";
import { chooseGrandmasterMove } from "../strategies/grandmasterStrategy";
import { chooseFixedDepthMinimaxMove } from "../strategies/minimaxStrategy";
import { chooseOnePlyMove } from "../strategies/onePlyStrategy";
import { chooseRandomMove } from "../strategies/randomStrategy";
import { chooseStrategicMove } from "../strategies/strategicStrategy";
import { chooseTeacherMove } from "../strategies/teacherStrategy";
import type { CpuMoveStrategy } from "../strategies/types";

export type CpuLevelPreset = {
  level: CpuLevel;
  chooseMove: CpuMoveStrategy;
};

export const cpuLevelPresets: Record<CpuLevel, CpuLevelPreset> = {
  level1: {
    level: "level1",
    chooseMove: chooseRandomMove,
  },
  level2: {
    level: "level2",
    chooseMove: chooseCornerMove,
  },
  level3: {
    level: "level3",
    chooseMove: chooseOnePlyMove,
  },
  level4: {
    level: "level4",
    chooseMove: chooseStrategicMove,
  },
  level5: {
    level: "level5",
    chooseMove: (board, disc) => chooseFixedDepthMinimaxMove(board, disc, 4),
  },
  level6: {
    level: "level6",
    chooseMove: chooseGrandmasterMove,
  },
  level7: {
    level: "level7",
    chooseMove: chooseTeacherMove,
  },
};

export function getCpuLevelPreset(level: CpuLevel): CpuLevelPreset {
  return cpuLevelPresets[level];
}
