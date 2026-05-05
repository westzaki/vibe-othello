import type { Advantage } from "../cpu";
import type { PlayerSettings } from "../game/players";
import { getSessionLegalMoves, type GameSession } from "../game/session";
import type { CoachHintModel } from "./coachHintModel";
import {
  canShowCoachBestMoveHint,
  canShowCoachHintAfterOpening,
  type CoachHintSettings,
} from "./coachHintModel";
import type { PlayPositionAnalysis } from "./createPlayPositionAnalysis";

export type CoachHintAnalysisDebugStatus =
  | "error"
  | "fallback"
  | "loading"
  | "ready"
  | "sync";

export type CoachHintDebugReason =
  | "analysisError"
  | "analysisFallback"
  | "analysisLoading"
  | "cpuThinking"
  | "cpuTurn"
  | "disabled"
  | "modeOff"
  | "noHints"
  | "noLegalMoves"
  | "notPlaying"
  | "openingWarmup"
  | "ready"
  | "twoPlayer"
  | "waitingForBestMove"
  | "waitingForDelay"
  | "waitingForDisadvantage";

export type CoachHintDebugSnapshot = {
  analysisHintCount: number;
  analysisStatus: CoachHintAnalysisDebugStatus;
  canShowBestMoveHint: boolean;
  hintKinds: string[];
  isAnalysisRequested: boolean;
  legalMoveCount: number;
  message: string;
  reason: CoachHintDebugReason;
  visibleHintKinds: string[];
};

export type CoachHintDebugContext = {
  advantage?: Advantage;
  analysis: PlayPositionAnalysis;
  analysisStatus: CoachHintAnalysisDebugStatus;
  enabled: boolean;
  isAnalysisRequested: boolean;
  isCpuThinking: boolean;
  players: PlayerSettings;
  session: GameSession;
  settings: CoachHintSettings;
  canRequestAnalysisAtDelay: boolean;
  model: CoachHintModel | null;
};

const coachHintDebugMessages: Record<CoachHintDebugReason, string> = {
  analysisError: "analysis request failed",
  analysisFallback: "worker fallback is showing lightweight analysis",
  analysisLoading: "waiting for worker analysis",
  cpuThinking: "CPU thinking",
  cpuTurn: "current turn is CPU",
  disabled: "coach hints disabled for this screen",
  modeOff: "coach hint mode is off",
  noHints: "analysis has no visible hints",
  noLegalMoves: "current player has no legal moves",
  notPlaying: "session is not playing",
  openingWarmup: "opening warmup",
  ready: "coach hint visible",
  twoPlayer: "two-player game",
  waitingForBestMove: "waiting for teacher best move",
  waitingForDelay: "waiting for coach delay",
  waitingForDisadvantage: "gentle mode is waiting for a harder position",
};

export function createCoachHintDebugSnapshot({
  analysis,
  analysisStatus,
  canRequestAnalysisAtDelay,
  enabled,
  isAnalysisRequested,
  isCpuThinking,
  model,
  players,
  session,
  settings,
}: CoachHintDebugContext): CoachHintDebugSnapshot {
  const legalMoveCount = getSessionLegalMoves(session).length;
  const canShowBestMoveHint = canShowCoachBestMoveHint(session);
  const reason = getCoachHintDebugReason({
    analysis,
    analysisStatus,
    canRequestAnalysisAtDelay,
    canShowBestMoveHint,
    enabled,
    isAnalysisRequested,
    isCpuThinking,
    legalMoveCount,
    model,
    players,
    session,
    settings,
  });

  return {
    analysisHintCount: analysis.coachHints.length,
    analysisStatus,
    canShowBestMoveHint,
    hintKinds: analysis.coachHints.map((hint) => hint.kind),
    isAnalysisRequested,
    legalMoveCount,
    message: coachHintDebugMessages[reason],
    reason,
    visibleHintKinds: model?.hints.map((hint) => hint.kind) ?? [],
  };
}

function getCoachHintDebugReason({
  analysis,
  analysisStatus,
  canRequestAnalysisAtDelay,
  canShowBestMoveHint,
  enabled,
  isAnalysisRequested,
  isCpuThinking,
  legalMoveCount,
  model,
  players,
  session,
  settings,
}: {
  analysis: PlayPositionAnalysis;
  analysisStatus: CoachHintAnalysisDebugStatus;
  canRequestAnalysisAtDelay: boolean;
  canShowBestMoveHint: boolean;
  enabled: boolean;
  isAnalysisRequested: boolean;
  isCpuThinking: boolean;
  legalMoveCount: number;
  model: CoachHintModel | null;
  players: PlayerSettings;
  session: GameSession;
  settings: CoachHintSettings;
}): CoachHintDebugReason {
  if (!enabled) {
    return "disabled";
  }

  if (settings.mode === "off") {
    return "modeOff";
  }

  if (session.status !== "playing") {
    return "notPlaying";
  }

  if (!isOnePlayerGame(players)) {
    return "twoPlayer";
  }

  if (players[session.currentDisc].type !== "human") {
    return "cpuTurn";
  }

  if (isCpuThinking) {
    return "cpuThinking";
  }

  if (legalMoveCount === 0) {
    return "noLegalMoves";
  }

  if (!canShowCoachHintAfterOpening(session)) {
    return "openingWarmup";
  }

  if (!canRequestAnalysisAtDelay) {
    return "waitingForDisadvantage";
  }

  if (!isAnalysisRequested) {
    return "waitingForDelay";
  }

  if (analysisStatus === "loading") {
    return "analysisLoading";
  }

  if (analysisStatus === "error") {
    return "analysisError";
  }

  if (analysisStatus === "fallback") {
    return "analysisFallback";
  }

  if (model !== null) {
    return "ready";
  }

  if (
    canShowBestMoveHint &&
    !analysis.coachHints.some((hint) => hint.kind === "bestMove")
  ) {
    return "waitingForBestMove";
  }

  return "noHints";
}

function isOnePlayerGame(players: PlayerSettings): boolean {
  return (
    (players.black.type === "human" && players.white.type === "cpu") ||
    (players.white.type === "human" && players.black.type === "cpu")
  );
}
