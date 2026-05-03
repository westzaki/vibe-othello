import type { DiscColor } from "./othello";
import {
  createDefaultPlayerSettings,
  type CpuLevel,
  type PlayerSettings,
} from "./players";

export type GameMode = "onePlayer" | "twoPlayer";
export type HumanDisc = DiscColor;

export function createMatchPlayerSettings(
  mode: GameMode,
  cpuLevel: CpuLevel,
  humanDisc: HumanDisc,
): PlayerSettings {
  const players = createDefaultPlayerSettings();

  players.black = {
    cpuLevel,
    type: "human",
  };
  players.white = {
    cpuLevel,
    type: "human",
  };

  if (mode === "onePlayer") {
    const cpuDisc = humanDisc === "black" ? "white" : "black";
    players[cpuDisc] = {
      cpuLevel,
      type: "cpu",
    };
  }

  return players;
}

export function getInitialGameMode(players: PlayerSettings): GameMode {
  return players.black.type === "cpu" || players.white.type === "cpu"
    ? "onePlayer"
    : "twoPlayer";
}

export function getInitialHumanDisc(players: PlayerSettings): HumanDisc {
  return players.black.type === "cpu" ? "white" : "black";
}
