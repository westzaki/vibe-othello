import { useEffect } from "react";
import { chooseCpuMove } from "../cpu/cpu";
import type { SquareIndex } from "../game/othello";
import type { PlayerConfig } from "../game/players";
import type { GameSession } from "../game/session";

const cpuMoveDelayMs = 350;

type UseCpuTurnParams = {
  currentPlayer: PlayerConfig;
  onPlaceDisc: (square: SquareIndex) => void;
  session: GameSession;
};

export function useCpuTurn({
  currentPlayer,
  onPlaceDisc,
  session,
}: UseCpuTurnParams) {
  useEffect(() => {
    if (session.status !== "playing" || currentPlayer.type !== "cpu") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const move = chooseCpuMove(
        session.board,
        session.currentDisc,
        currentPlayer.cpuLevel,
      );

      if (move !== null) {
        onPlaceDisc(move);
      }
    }, cpuMoveDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [currentPlayer, onPlaceDisc, session]);
}
