import type { CpuLevel } from "../game/players";
import type { Board, DiscColor } from "../game/othello";
import { chooseCornerMove } from "./strategies/cornerStrategy";
import { chooseGrandmasterMove } from "./strategies/grandmasterStrategy";
import { chooseFixedDepthMinimaxMove } from "./strategies/minimaxStrategy";
import { chooseOnePlyMove } from "./strategies/onePlyStrategy";
import { chooseRandomMove } from "./strategies/randomStrategy";
import { chooseStrategicMove } from "./strategies/strategicStrategy";

export function chooseCpuMove(
  board: Board,
  disc: DiscColor,
  level: CpuLevel,
): number | null {
  if (level === "level6") {
    return chooseGrandmasterMove(board, disc);
  }

  if (level === "level5") {
    return chooseFixedDepthMinimaxMove(board, disc, 4);
  }

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
