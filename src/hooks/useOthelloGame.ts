import { useMemo, useState } from "react";
import {
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  type GameSession,
} from "../game/session";

export function useOthelloGame() {
  const [session, setSession] = useState(createGameSession);
  const legalMoves = useMemo(() => getSessionLegalMoves(session), [session]);

  return {
    board: session.board,
    currentDisc: session.currentDisc,
    discCounts: session.discCounts,
    gameStatus: session.status,
    isPlaying: session.status === "playing",
    lastMove: session.lastMove,
    legalMoves,
    winner: session.winner,
    endGame: () => setSession((currentSession) => endGame(currentSession)),
    placeCurrentDisc: (square: number) =>
      setSession((currentSession) => placeCurrentDisc(currentSession, square)),
    replaceSession: (nextSession: GameSession) => setSession(nextSession),
    startNewGame: () => setSession(startNewGame()),
  };
}
