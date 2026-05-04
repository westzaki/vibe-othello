import type { Board, DiscColor } from "../game/othello";
import type { CpuLevel } from "./cpuLevels";
import { getCpuLevelPreset } from "./presets/cpuLevelPresets";

export function chooseCpuMove(
  board: Board,
  disc: DiscColor,
  level: CpuLevel,
): number | null {
  return getCpuLevelPreset(level).chooseMove(board, disc);
}
