import { useEffect } from "react";
import { chooseCpuMove } from "../cpu";
import type { SquareIndex } from "../game/othello";
import type { PlayerConfig } from "../game/players";
import type { GameSession } from "../game/session";

const cpuMoveDelayMs = 350;
const cpuMoveDelayAfterPassMs = 2800;

type UseCpuTurnParams = {
  currentPlayer: PlayerConfig;
  enabled: boolean;
  onPlaceDisc: (square: SquareIndex) => void;
  session: GameSession;
};

export function useCpuTurn({
  currentPlayer,
  enabled,
  onPlaceDisc,
  session,
}: UseCpuTurnParams): boolean {
  const isCpuThinking =
    enabled && session.status === "playing" && currentPlayer.type === "cpu";

  useEffect(() => {
    if (!isCpuThinking) {
      return;
    }

    const moveDelayMs =
      session.notice?.type === "pass"
        ? cpuMoveDelayAfterPassMs
        : cpuMoveDelayMs;

    const timeoutId = window.setTimeout(() => {
      const move = chooseCpuMove(
        session.board,
        session.currentDisc,
        currentPlayer.cpuLevel,
      );

      if (move === null) {
        if (import.meta.env.DEV) {
          console.warn(
            "CPU turn could not choose a legal move.",
            {
              cpuLevel: currentPlayer.cpuLevel,
              currentDisc: session.currentDisc,
            },
          );
        }

        return;
      }

      onPlaceDisc(move);
    }, moveDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [currentPlayer, isCpuThinking, onPlaceDisc, session]);

  return isCpuThinking;
}
