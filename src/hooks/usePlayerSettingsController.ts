import { useState } from "react";
import type { CpuLevel } from "../cpu";
import type { DiscColor } from "../game/othello";
import {
  createDefaultPlayerSettings,
  type PlayerSettings,
  type PlayerType,
} from "../game/players";

export type PlayerSettingsController = {
  players: PlayerSettings;
  setCpuLevel: (disc: DiscColor, cpuLevel: CpuLevel) => void;
  setPlayers: (nextPlayers: PlayerSettings) => void;
  setPlayerType: (disc: DiscColor, playerType: PlayerType) => void;
};

export function usePlayerSettingsController(): PlayerSettingsController {
  const [players, setPlayers] = useState(createDefaultPlayerSettings);

  function setPlayerType(disc: DiscColor, playerType: PlayerType) {
    setPlayers((currentPlayers) => ({
      ...currentPlayers,
      [disc]: {
        ...currentPlayers[disc],
        type: playerType,
      },
    }));
  }

  function setCpuLevel(disc: DiscColor, cpuLevel: CpuLevel) {
    setPlayers((currentPlayers) => ({
      ...currentPlayers,
      [disc]: {
        ...currentPlayers[disc],
        cpuLevel,
      },
    }));
  }

  return {
    players,
    setCpuLevel,
    setPlayers,
    setPlayerType,
  };
}
