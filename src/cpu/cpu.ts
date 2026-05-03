import type { CpuLevel } from "../game/players";
import type { Board, DiscColor } from "../game/othello";
import { getCpuLevelPreset } from "./presets/cpuLevelPresets";

export function chooseCpuMove(
  board: Board,
  disc: DiscColor,
  level: CpuLevel,
): number | null {
  return getCpuLevelPreset(level).chooseMove(board, disc);
}
