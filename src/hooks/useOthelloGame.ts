import { useCallback, useEffect, useMemo, useState } from "react";
import {
  playFlipDiscSound,
  playPlaceDiscSound,
  unlockGameAudio,
} from "../audio/gameSounds";
import { chooseCpuMove } from "../cpu/cpu";
import type { DiscColor } from "../game/othello";
import {
  createDefaultPlayerSettings,
  type CpuLevel,
  type PlayerType,
} from "../game/players";
import {
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  type GameSession,
} from "../game/session";

const firstFlipSoundDelayMs = 110;
const flipSoundDelayMs = 70;

export function useOthelloGame() {
  const [session, setSession] = useState(createGameSession);
  const [players, setPlayers] = useState(createDefaultPlayerSettings);
  const [lastFlippedSquares, setLastFlippedSquares] = useState<number[]>([]);
  const [flipAnimationId, setFlipAnimationId] = useState(0);
  const legalMoves = useMemo(() => getSessionLegalMoves(session), [session]);
  const isPlaying = session.status === "playing";
  const currentPlayer = players[session.currentDisc];
  const currentPlayerType = currentPlayer.type;
  const canHumanPlay = isPlaying && currentPlayerType === "human";

  function clearAnimationState() {
    setLastFlippedSquares([]);
  }

  function handleEndGame() {
    setSession((currentSession) => endGame(currentSession));
    clearAnimationState();
  }

  const handlePlaceCurrentDisc = useCallback((square: number) => {
    setSession((currentSession) => {
      const result = placeCurrentDisc(currentSession, square);

      if (result.move !== null) {
        setLastFlippedSquares(result.move.flippedSquares);
        setFlipAnimationId((currentId) => currentId + 1);
      }

      return result.session;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying || currentPlayerType !== "cpu") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const move = chooseCpuMove(
        session.board,
        session.currentDisc,
        currentPlayer.cpuLevel,
      );

      if (move !== null) {
        handlePlaceCurrentDisc(move);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentPlayerType,
    handlePlaceCurrentDisc,
    isPlaying,
    currentPlayer.cpuLevel,
    session.board,
    session.currentDisc,
  ]);

  useEffect(() => {
    if (flipAnimationId === 0) {
      return;
    }

    playPlaceDiscSound();

    const timeoutIds = lastFlippedSquares.map((_, index) =>
      window.setTimeout(
        playFlipDiscSound,
        firstFlipSoundDelayMs + index * flipSoundDelayMs,
      ),
    );

    return () => {
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [flipAnimationId, lastFlippedSquares]);

  function handleReplaceSession(nextSession: GameSession) {
    setSession(nextSession);
    clearAnimationState();
  }

  function handleResetGame() {
    setSession(createGameSession());
    clearAnimationState();
  }

  function handleStartNewGame() {
    unlockGameAudio();
    setSession(startNewGame());
    clearAnimationState();
  }

  function handlePlayerTypeChange(disc: DiscColor, playerType: PlayerType) {
    setPlayers((currentPlayers) => ({
      ...currentPlayers,
      [disc]: {
        ...currentPlayers[disc],
        type: playerType,
      },
    }));
  }

  function handleCpuLevelChange(disc: DiscColor, cpuLevel: CpuLevel) {
    setPlayers((currentPlayers) => ({
      ...currentPlayers,
      [disc]: {
        ...currentPlayers[disc],
        cpuLevel,
      },
    }));
  }

  return {
    board: session.board,
    canHumanPlay,
    currentDisc: session.currentDisc,
    currentPlayerType,
    discCounts: session.discCounts,
    endReason: session.endReason,
    flipAnimationId,
    flippedSquares: lastFlippedSquares,
    gameStatus: session.status,
    isPlaying: session.status === "playing",
    lastMove: session.lastMove,
    legalMoves,
    message: session.message,
    players,
    winner: session.winner,
    endGame: handleEndGame,
    placeCurrentDisc: handlePlaceCurrentDisc,
    setCpuLevel: handleCpuLevelChange,
    setPlayerType: handlePlayerTypeChange,
    replaceSession: handleReplaceSession,
    resetGame: handleResetGame,
    startNewGame: handleStartNewGame,
  };
}
