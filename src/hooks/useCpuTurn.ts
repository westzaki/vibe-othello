import { useEffect } from "react";
import type { SquareIndex } from "../game/othello";
import type { PlayerConfig } from "../game/players";
import type { GameSession } from "../game/session";
import { chooseCpuMoveAsync } from "../services/cpuMoveService";

const cpuMoveDelayMs = 650;
const cpuMoveDelayAfterPassMs = 3200;
let nextCpuMoveRequestId = 0;

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
  const cpuLevel = currentPlayer.cpuLevel;

  useEffect(() => {
    if (!isCpuThinking) {
      return;
    }

    let cancelled = false;
    const requestId = `cpu-move-${nextCpuMoveRequestId}`;
    nextCpuMoveRequestId += 1;
    const moveDelayMs =
      session.notice?.type === "pass"
        ? cpuMoveDelayAfterPassMs
        : cpuMoveDelayMs;

    const timeoutId = window.setTimeout(() => {
      void chooseCpuMoveAsync({
        board: session.board,
        disc: session.currentDisc,
        level: cpuLevel,
        requestId,
      }).then((response) => {
        if (cancelled || response.requestId !== requestId) {
          return;
        }

        if (response.move === null) {
          if (import.meta.env.DEV) {
            console.warn("CPU turn could not choose a legal move.", {
              cpuLevel,
              currentDisc: session.currentDisc,
              requestId,
            });
          }

          return;
        }

        onPlaceDisc(response.move);
      });
    }, moveDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [cpuLevel, isCpuThinking, onPlaceDisc, session]);

  return isCpuThinking;
}
