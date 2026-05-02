import type { CpuLevel } from "../game/players";
import type { Board, DiscColor } from "../game/othello";
import { chooseCornerMove } from "./cornerCpu";
import { chooseOnePlyMove } from "./onePlyCpu";
import { chooseRandomMove } from "./randomCpu";
import { chooseStrategicMove } from "./strategicCpu";

export function chooseCpuMove(
  board: Board,
  disc: DiscColor,
  level: CpuLevel,
): number | null {
  if (level === "level4") {
    return chooseStrategicMove(board, disc);
  }

  if (level === "level3") {
    return chooseOnePlyMove(board, disc);
  }

  if (level === "level2") {
    return chooseCornerMove(board, disc);
  }

  return chooseRandomMove(board, disc);
}
