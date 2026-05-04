import type { Advantage } from "../cpu";
import type { PlayerSettings } from "../game/players";
import { getSessionLegalMoves, type GameSession } from "../game/session";
import { createCoachHint, type CoachHint } from "./createCoachHint";

export type CoachHintMode = "off" | "gentle" | "active";

export type CoachHintSettings = {
  mode: CoachHintMode;
};

export type CoachHintModel = {
  hint: CoachHint;
  mode: Exclude<CoachHintMode, "off">;
};

export type CoachHintVisibilityContext = {
  advantage?: Advantage;
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
  if (!canShowCoachHint(context)) {
    return null;
  }

  const mode = context.settings.mode;

  if (mode === "off") {
    return null;
  }

  const hint = createCoachHint(
    context.session.board,
    context.session.currentDisc,
    {
      messageStyle: mode === "gentle" ? "vague" : "specific",
    },
  );

  if (hint === null) {
    return null;
  }

  return {
    hint,
    mode,
  };
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
