import type { Advantage } from "../cpu";
import type { SquareIndex } from "../game/othello";
import type { PlayerSettings } from "../game/players";
import { getSessionLegalMoves, type GameSession } from "../game/session";
import type { CoachHint } from "./createCoachHint";
import {
  createPlayPositionAnalysis,
  type CreatePlayPositionAnalysisOptions,
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

export type CoachBestMoveAnalysisRequestContext =
  CoachHintVisibilityContext & {
    enabled?: boolean;
  };

export const defaultCoachHintSettings: CoachHintSettings = {
  mode: "gentle",
};

const activeHintDelayMs = 1500;
const gentleHintDelayMs = 4500;
const gentleDisadvantagePercent = 45;
const minimumCoachHintMoveCount = 4;
const minimumBestMoveHintMoveCount = 6;
const coachGuidanceSearchDepth = 4;
const teacherGuidanceShallowSearchDepth = 3;
const teacherGuidanceDeepSearchDepth = 6;

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

  if (!canShowCoachHintAfterOpening(session)) {
    return false;
  }

  return canTriggerCoachHint({
    advantage,
    currentDisc: session.currentDisc,
    mode: settings.mode,
    thinkingTimeMs,
  });
}

export function canRequestCoachBestMoveAnalysis({
  enabled = true,
  ...context
}: CoachBestMoveAnalysisRequestContext): boolean {
  if (!enabled) {
    return false;
  }

  if (!canShowCoachBestMoveHint(context.session)) {
    return false;
  }

  if (!canPrepareCoachHint(context)) {
    return false;
  }

  return canTriggerCoachHint({
    advantage: context.advantage,
    currentDisc: context.session.currentDisc,
    mode: context.settings.mode,
    thinkingTimeMs: context.thinkingTimeMs ?? 0,
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
  const shouldIncludeBestMoveHint = canShowCoachBestMoveHint(context.session);
  const analysis =
    getCurrentAnalysis(context.analysis, context.session, legalMoves) ??
    createPlayPositionAnalysis(
      context.session.board,
      context.session.currentDisc,
      createCoachPlayPositionAnalysisOptions(mode, {
        includeBestMoveHint: shouldIncludeBestMoveHint,
      }),
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

  const hints = getVisibleCoachHints(analysis.coachHints, {
    includeBestMoveHint: shouldIncludeBestMoveHint,
  });

  if (
    requiresTeacherGuidanceHint(mode, shouldIncludeBestMoveHint) &&
    !hasBestMoveHint(hints)
  ) {
    return null;
  }

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

function requiresTeacherGuidanceHint(
  mode: Exclude<CoachHintMode, "off">,
  includeBestMoveHint: boolean,
): boolean {
  return includeBestMoveHint && (mode === "gentle" || mode === "active");
}

function hasBestMoveHint(hints: CoachHint[]): boolean {
  return hints.some((hint) => hint.kind === "bestMove");
}

export function createCoachPlayPositionAnalysisOptions(
  mode: CoachHintMode,
  {
    includeBestMoveHint = mode !== "off",
  }: {
    includeBestMoveHint?: boolean;
  } = {},
): CreatePlayPositionAnalysisOptions {
  return {
    includeBestMoveHint: mode !== "off" && includeBestMoveHint,
    includeCandidateFallback: mode !== "off" && includeBestMoveHint,
    guidanceMode: mode === "off" ? undefined : "auto",
    messageStyle: mode === "gentle" ? "vague" : "specific",
    riskHintLimit: mode === "active" ? 3 : 2,
    searchDepth: mode === "off" ? undefined : coachGuidanceSearchDepth,
    shallowSearchDepth:
      mode === "off" ? undefined : teacherGuidanceShallowSearchDepth,
    deepSearchDepth: mode === "off" ? undefined : teacherGuidanceDeepSearchDepth,
    useSelectiveDeepening: mode !== "off",
    useTeacherGuidanceMove: mode !== "off" && includeBestMoveHint,
  };
}

export function getCoachHintDelayMs(mode: CoachHintMode): number | null {
  if (mode === "active") {
    return activeHintDelayMs;
  }

  if (mode === "gentle") {
    return gentleHintDelayMs;
  }

  return null;
}

export function canShowCoachHintAfterOpening(session: GameSession): boolean {
  return getPlayedMoveCount(session) >= minimumCoachHintMoveCount;
}

export function canShowCoachBestMoveHint(session: GameSession): boolean {
  return getPlayedMoveCount(session) >= minimumBestMoveHintMoveCount;
}

function getVisibleCoachHints(
  hints: CoachHint[],
  {
    includeBestMoveHint,
  }: {
    includeBestMoveHint: boolean;
  },
): CoachHint[] {
  if (includeBestMoveHint) {
    return hints;
  }

  return hints.filter(
    (hint) => hint.kind !== "bestMove" && hint.kind !== "candidate",
  );
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

  if (!canShowCoachHintAfterOpening(session)) {
    return false;
  }

  return thinkingTimeMs >= (getCoachHintDelayMs(settings.mode) ?? Infinity);
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

function getPlayedMoveCount(session: GameSession): number {
  return Math.max(
    session.moveHistory.length,
    Math.max(0, session.discCounts.black + session.discCounts.white - 4),
  );
}

function isOnePlayerGame(players: PlayerSettings): boolean {
  return (
    (players.black.type === "human" && players.white.type === "cpu") ||
    (players.white.type === "human" && players.black.type === "cpu")
  );
}
