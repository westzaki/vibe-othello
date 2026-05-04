import { useCallback, useMemo, useState } from "react";
import { unlockGameAudio } from "../audio/gameSounds";
import type { CpuLevel } from "../cpu";
import type {
  Board,
  DiscColor,
  DiscCounts,
  SquareIndex,
  Winner,
} from "../game/othello";
import {
  createDefaultPlayerSettings,
  type PlayerSettings,
  type PlayerType,
} from "../game/players";
import {
  canUndoSessionMove,
  createGameSession,
  endGame,
  getSessionLegalMoves,
  placeCurrentDisc,
  startNewGame,
  startPracticeSession,
  undoSessionMove,
  type GameEndReason,
  type GameSession,
  type GameSessionNotice,
  type GameStatus,
  type MoveRecord,
  type PracticeSessionOptions,
} from "../game/session";
import { formatGameSessionNotice } from "./formatGameSessionNotice";
import { useCpuTurn } from "./useCpuTurn";
import { useMoveAnimationState } from "./useMoveAnimationState";
import { useMoveSounds } from "./useMoveSounds";

type UseOthelloGameOptions = {
  enabled?: boolean;
  soundEnabled?: boolean;
  undoEnabled?: boolean;
};

export type OthelloGameController = {
  board: Board;
  canHumanPlay: boolean;
  canUndo: boolean;
  currentDisc: DiscColor;
  currentPlayerType: PlayerType;
  discCounts: DiscCounts;
  endReason: GameEndReason | null;
  flipAnimationId: number;
  flippedSquares: SquareIndex[];
  gameStatus: GameStatus;
  isCpuThinking: boolean;
  isPlaying: boolean;
  lastMove: SquareIndex | null;
  legalMoves: SquareIndex[];
  message: string | null;
  moveHistory: MoveRecord[];
  notice: GameSessionNotice | null;
  players: PlayerSettings;
  winner: Winner | null;
  endGame: () => void;
  placeCurrentDisc: (square: SquareIndex) => void;
  undoMove: () => void;
  setCpuLevel: (disc: DiscColor, cpuLevel: CpuLevel) => void;
  setPlayers: (nextPlayers: PlayerSettings) => void;
  setPlayerType: (disc: DiscColor, playerType: PlayerType) => void;
  replaceSession: (nextSession: GameSession) => void;
  resetGame: () => void;
  startNewGame: () => void;
  startPracticeSession: (options: PracticeSessionOptions) => void;
};

export function useOthelloGame({
  enabled = true,
  soundEnabled = true,
  undoEnabled = true,
}: UseOthelloGameOptions = {}): OthelloGameController {
  const [session, setSession] = useState(createGameSession);
  const [players, setPlayers] = useState(createDefaultPlayerSettings);
  const {
    clearAnimationState,
    flipAnimationId,
    flippedSquares,
    recordMoveAnimation,
  } = useMoveAnimationState();
  const legalMoves = useMemo(() => getSessionLegalMoves(session), [session]);
  const isPlaying = session.status === "playing";
  const currentPlayer = players[session.currentDisc];
  const currentPlayerType = currentPlayer.type;
  const canHumanPlay = isPlaying && currentPlayerType === "human";
  const canUndo = undoEnabled && canUndoSessionMove(session, players);

  function handleEndGame() {
    setSession((currentSession) => endGame(currentSession));
    clearAnimationState();
  }

  const handlePlaceCurrentDisc = useCallback((square: SquareIndex) => {
    setSession((currentSession) => {
      const result = placeCurrentDisc(currentSession, square);

      if (result.move !== null) {
        recordMoveAnimation(result.move);
      }

      return result.session;
    });
  }, [recordMoveAnimation]);

  const isCpuThinking = useCpuTurn({
    currentPlayer,
    enabled,
    onPlaceDisc: handlePlaceCurrentDisc,
    session,
  });
  useMoveSounds({
    enabled: enabled && soundEnabled,
    flipAnimationId,
    flippedSquares,
  });

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

  function handleUndoMove() {
    if (!undoEnabled || isCpuThinking) {
      return;
    }

    setSession((currentSession) => {
      const undoneSession = undoSessionMove(currentSession, players);

      return undoneSession ?? currentSession;
    });
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

  function handlePlayerSettingsChange(nextPlayers: PlayerSettings) {
    setPlayers(nextPlayers);
  }

  return {
    board: session.board,
    canHumanPlay,
    canUndo,
    currentDisc: session.currentDisc,
    currentPlayerType,
    discCounts: session.discCounts,
    endReason: session.endReason,
    flipAnimationId,
    flippedSquares,
    gameStatus: session.status,
    isCpuThinking,
    isPlaying: session.status === "playing",
    lastMove: session.lastMove,
    legalMoves,
    message: formatGameSessionNotice(session.notice),
    moveHistory: session.moveHistory,
    notice: session.notice,
    players,
    winner: session.winner,
    endGame: handleEndGame,
    placeCurrentDisc: handlePlaceCurrentDisc,
    undoMove: handleUndoMove,
    setCpuLevel: handleCpuLevelChange,
    setPlayers: handlePlayerSettingsChange,
    setPlayerType: handlePlayerTypeChange,
    replaceSession: handleReplaceSession,
    resetGame: handleResetGame,
    startNewGame: handleStartNewGame,
    startPracticeSession: handleStartPracticeSession,
  };
}
