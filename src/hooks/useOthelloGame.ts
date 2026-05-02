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
  const [lastFlippedSquares, setLastFlippedSquares] = useState<number[]>([]);
  const [flipAnimationId, setFlipAnimationId] = useState(0);
  const legalMoves = useMemo(() => getSessionLegalMoves(session), [session]);

  function clearAnimationState() {
    setLastFlippedSquares([]);
  }

  function handleEndGame() {
    setSession((currentSession) => endGame(currentSession));
    clearAnimationState();
  }

  function handlePlaceCurrentDisc(square: number) {
    setSession((currentSession) => {
      const result = placeCurrentDisc(currentSession, square);

      if (result.move !== null) {
        setLastFlippedSquares(result.move.flippedSquares);
        setFlipAnimationId((currentId) => currentId + 1);
      }

      return result.session;
    });
  }

  function handleReplaceSession(nextSession: GameSession) {
    setSession(nextSession);
    clearAnimationState();
  }

  function handleStartNewGame() {
    setSession(startNewGame());
    clearAnimationState();
  }

  return {
    board: session.board,
    currentDisc: session.currentDisc,
    discCounts: session.discCounts,
    flipAnimationId,
    flippedSquares: lastFlippedSquares,
    gameStatus: session.status,
    isPlaying: session.status === "playing",
    lastMove: session.lastMove,
    legalMoves,
    message: session.message,
    winner: session.winner,
    endGame: handleEndGame,
    placeCurrentDisc: handlePlaceCurrentDisc,
    replaceSession: handleReplaceSession,
    startNewGame: handleStartNewGame,
  };
}
