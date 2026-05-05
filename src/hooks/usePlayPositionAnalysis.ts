import { useMemo } from "react";
import type { GameSession } from "../game/session";
import {
  createPlayPositionAnalysis,
  type PlayPositionAnalysis,
} from "../teacher";

export function usePlayPositionAnalysis(
  session: GameSession,
): PlayPositionAnalysis {
  return useMemo(
    () => createPlayPositionAnalysis(session.board, session.currentDisc),
    [session.board, session.currentDisc],
  );
}
