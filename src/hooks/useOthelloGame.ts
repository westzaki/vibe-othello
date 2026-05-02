import { useMemo, useState } from "react";
import {
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
} from "../game/session";

export function useOthelloGame() {
  const [session, setSession] = useState(createGameSession);
  const legalMoves = useMemo(() => getSessionLegalMoves(session), [session]);

  return {
    board: session.board,
    currentDisc: session.currentDisc,
    gameStatus: session.status,
    isPlaying: session.status === "playing",
    legalMoves,
    endGame: () => setSession((currentSession) => endGame(currentSession)),
    placeCurrentDisc: (square: number) =>
      setSession((currentSession) => placeCurrentDisc(currentSession, square)),
    startNewGame: () => setSession(startNewGame()),
  };
}
