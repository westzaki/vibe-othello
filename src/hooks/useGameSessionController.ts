import { useCallback, useMemo, useState } from "react";
import { unlockGameAudio } from "../audio/gameSounds";
import type { SquareIndex } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import {
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  startPracticeSession,
  undoSessionMove,
  type GameSession,
  type PracticeSessionOptions,
} from "../game/session";
import { useMoveAnimationState } from "./useMoveAnimationState";

export type GameSessionController = {
  flipAnimationId: number;
  flippedSquares: SquareIndex[];
  legalMoves: SquareIndex[];
  placedSquare: SquareIndex | null;
  session: GameSession;
  endGame: () => void;
  placeCurrentDisc: (square: SquareIndex) => void;
  replaceSession: (nextSession: GameSession) => void;
  resetGame: () => void;
  startNewGame: () => void;
  startPracticeSession: (options: PracticeSessionOptions) => void;
  undoMove: (players: PlayerSettings) => void;
};

export function useGameSessionController(
  soundEnabled: boolean,
): GameSessionController {
  const [session, setSession] = useState(createGameSession);
  const {
    clearAnimationState,
    flipAnimationId,
    flippedSquares,
    placedSquare,
    recordMoveAnimation,
  } = useMoveAnimationState();
  const legalMoves = useMemo(() => getSessionLegalMoves(session), [session]);

  function handleEndGame() {
    setSession((currentSession) => endGame(currentSession));
    clearAnimationState();
  }

  const handlePlaceCurrentDisc = useCallback(
    (square: SquareIndex) => {
      setSession((currentSession) => {
        const result = placeCurrentDisc(currentSession, square);

        if (result.move !== null) {
          recordMoveAnimation(result.move);
        }

        return result.session;
      });
    },
    [recordMoveAnimation],
  );

  function handleReplaceSession(nextSession: GameSession) {
    setSession(nextSession);
    clearAnimationState();
  }

  function handleResetGame() {
    setSession(createGameSession());
    clearAnimationState();
  }

  function handleStartNewGame() {
    if (soundEnabled) {
      unlockGameAudio();
    }

    setSession(startNewGame());
    clearAnimationState();
  }

  function handleStartPracticeSession(options: PracticeSessionOptions) {
    if (soundEnabled) {
      unlockGameAudio();
    }

    setSession(startPracticeSession(options));
    clearAnimationState();
  }

  function handleUndoMove(players: PlayerSettings) {
    setSession((currentSession) => {
      const undoneSession = undoSessionMove(currentSession, players);

      return undoneSession ?? currentSession;
    });
    clearAnimationState();
  }

  return {
    flipAnimationId,
    flippedSquares,
    legalMoves,
    placedSquare,
    session,
    endGame: handleEndGame,
    placeCurrentDisc: handlePlaceCurrentDisc,
    replaceSession: handleReplaceSession,
    resetGame: handleResetGame,
    startNewGame: handleStartNewGame,
    startPracticeSession: handleStartPracticeSession,
    undoMove: handleUndoMove,
  };
}
