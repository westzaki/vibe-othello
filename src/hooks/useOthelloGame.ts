import type { CpuLevel } from "../cpu";
import type {
  Board,
  DiscColor,
  DiscCounts,
  SquareIndex,
  Winner,
} from "../game/othello";
import type { PlayerSettings, PlayerType } from "../game/players";
import {
  canUndoSessionMove,
  type GameEndReason,
  type GameSession,
  type GameSessionNotice,
  type GameStatus,
  type MoveRecord,
  type PracticeSessionOptions,
} from "../game/session";
import { useCpuTurn } from "./useCpuTurn";
import { useGameSessionController } from "./useGameSessionController";
import { useMoveSounds } from "./useMoveSounds";
import { usePlayerSettingsController } from "./usePlayerSettingsController";

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
  moveHistory: MoveRecord[];
  notice: GameSessionNotice | null;
  placedSquare: SquareIndex | null;
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
  undoEnabled: boolean;
};

export function useOthelloGame({
  enabled = true,
  soundEnabled = true,
  undoEnabled = true,
}: UseOthelloGameOptions = {}): OthelloGameController {
  const playerSettings = usePlayerSettingsController();
  const sessionController = useGameSessionController(soundEnabled);
  const { players } = playerSettings;
  const {
    flipAnimationId,
    flippedSquares,
    legalMoves,
    placedSquare,
    session,
  } = sessionController;
  const isPlaying = session.status === "playing";
  const currentPlayer = players[session.currentDisc];
  const currentPlayerType = currentPlayer.type;
  const canHumanPlay = isPlaying && currentPlayerType === "human";
  const canUndo = undoEnabled && canUndoSessionMove(session, players);

  const isCpuThinking = useCpuTurn({
    currentPlayer,
    enabled,
    onPlaceDisc: sessionController.placeCurrentDisc,
    session,
  });
  useMoveSounds({
    enabled: enabled && soundEnabled,
    flipAnimationId,
    flippedSquares,
    placedSquare,
  });

  function handleUndoMove() {
    if (!undoEnabled || isCpuThinking) {
      return;
    }

    sessionController.undoMove(players);
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
    isPlaying,
    lastMove: session.lastMove,
    legalMoves,
    moveHistory: session.moveHistory,
    notice: session.notice,
    placedSquare,
    players,
    winner: session.winner,
    endGame: sessionController.endGame,
    placeCurrentDisc: sessionController.placeCurrentDisc,
    undoMove: handleUndoMove,
    setCpuLevel: playerSettings.setCpuLevel,
    setPlayers: playerSettings.setPlayers,
    setPlayerType: playerSettings.setPlayerType,
    replaceSession: sessionController.replaceSession,
    resetGame: sessionController.resetGame,
    startNewGame: sessionController.startNewGame,
    startPracticeSession: sessionController.startPracticeSession,
    undoEnabled,
  };
}
