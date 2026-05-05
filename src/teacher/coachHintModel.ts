import type { Advantage } from "../cpu";
import type { SquareIndex } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import { getSessionLegalMoves, type GameSession } from "../game/session";
import type { CoachHint } from "./createCoachHint";
import {
  createPlayPositionAnalysis,
  type PlayPositionAnalysis,
} from "./createPlayPositionAnalysis";

export type CoachHintMode = "off" | "gentle" | "active";

export type CoachHintSettings = {
  mode: CoachHintMode;
};

export type CoachHintModel = {
  analysis: PlayPositionAnalysis;
  hint: CoachHint;
  hints: CoachHint[];
  mode: Exclude<CoachHintMode, "off">;
};

export type CoachHintVisibilityContext = {
  advantage?: Advantage;
  analysis?: PlayPositionAnalysis;
  isCpuThinking?: boolean;
  players: PlayerSettings;
  session: GameSession;
  settings: CoachHintSettings;
  thinkingTimeMs?: number;
};

export const defaultCoachHintSettings: CoachHintSettings = {
  mode: "gentle",
};

const activeHintDelayMs = 1500;
const gentleHintDelayMs = 4500;
const gentleDisadvantagePercent = 45;

export function canShowCoachHint({
  advantage,
  isCpuThinking = false,
  players,
  session,
  settings,
  thinkingTimeMs = 0,
}: CoachHintVisibilityContext): boolean {
  if (settings.mode === "off" || isCpuThinking) {
    return false;
  }

  if (session.status !== "playing") {
    return false;
  }

  if (!isOnePlayerGame(players)) {
    return false;
  }

  if (players[session.currentDisc].type !== "human") {
    return false;
  }

  if (getSessionLegalMoves(session).length === 0) {
    return false;
  }

  return canTriggerCoachHint({
    advantage,
    currentDisc: session.currentDisc,
    mode: settings.mode,
    thinkingTimeMs,
  });
}

export function createCoachHintModel(
  context: CoachHintVisibilityContext,
): CoachHintModel | null {
  if (!canPrepareCoachHint(context)) {
    return null;
  }

  const mode = context.settings.mode;

  if (mode === "off") {
    return null;
  }

  const legalMoves = getSessionLegalMoves(context.session);
  const analysis =
    getCurrentAnalysis(context.analysis, context.session, legalMoves) ??
    createPlayPositionAnalysis(
      context.session.board,
      context.session.currentDisc,
      {
        includeCandidateFallback: mode === "active",
        messageStyle: mode === "gentle" ? "vague" : "specific",
      },
    );

  if (
    !canTriggerCoachHint({
      advantage: context.advantage ?? analysis.advantage,
      currentDisc: context.session.currentDisc,
      mode,
      thinkingTimeMs: context.thinkingTimeMs ?? 0,
    })
  ) {
    return null;
  }

  const hints = analysis.coachHints;
  const hint = hints[0] ?? null;

  if (hint === null) {
    return null;
  }

  return {
    analysis,
    hint,
    hints,
    mode,
  };
}

function getCurrentAnalysis(
  analysis: PlayPositionAnalysis | undefined,
  session: GameSession,
  legalMoves: SquareIndex[],
): PlayPositionAnalysis | null {
  if (analysis === undefined) {
    return null;
  }

  if (analysis.currentDisc !== session.currentDisc) {
    return null;
  }

  if (!areLegalMovesEqual(analysis.legalMoves, legalMoves)) {
    return null;
  }

  return analysis;
}

function areLegalMovesEqual(
  firstMoves: SquareIndex[],
  secondMoves: SquareIndex[],
): boolean {
  return (
    firstMoves.length === secondMoves.length &&
    firstMoves.every((move, index) => move === secondMoves[index])
  );
}

function canPrepareCoachHint({
  isCpuThinking = false,
  players,
  session,
  settings,
  thinkingTimeMs = 0,
}: CoachHintVisibilityContext): boolean {
  if (settings.mode === "off" || isCpuThinking) {
    return false;
  }

  if (session.status !== "playing") {
    return false;
  }

  if (!isOnePlayerGame(players)) {
    return false;
  }

  if (players[session.currentDisc].type !== "human") {
    return false;
  }

  if (getSessionLegalMoves(session).length === 0) {
    return false;
  }

  if (settings.mode === "active") {
    return thinkingTimeMs >= activeHintDelayMs;
  }

  return thinkingTimeMs >= gentleHintDelayMs;
}

function canTriggerCoachHint({
  advantage,
  currentDisc,
  mode,
  thinkingTimeMs,
}: {
  advantage: Advantage | undefined;
  currentDisc: GameSession["currentDisc"];
  mode: CoachHintMode;
  thinkingTimeMs: number;
}): boolean {
  if (mode === "off") {
    return false;
  }

  if (mode === "active") {
    return thinkingTimeMs >= activeHintDelayMs;
  }

  return (
    thinkingTimeMs >= gentleHintDelayMs &&
    advantage !== undefined &&
    getAdvantagePercent(advantage, currentDisc) <= gentleDisadvantagePercent
  );
}

function getAdvantagePercent(
  advantage: Advantage,
  disc: GameSession["currentDisc"],
): number {
  return disc === "black" ? advantage.blackPercent : advantage.whitePercent;
}

function isOnePlayerGame(players: PlayerSettings): boolean {
  return (
    (players.black.type === "human" && players.white.type === "cpu") ||
    (players.white.type === "human" && players.black.type === "cpu")
  );
}
