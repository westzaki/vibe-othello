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
  isCpuThinking?: boolean;
  players: PlayerSettings;
  session: GameSession;
  settings: CoachHintSettings;
};

export const defaultCoachHintSettings: CoachHintSettings = {
  mode: "gentle",
};

const gentleHintKinds = ["cornerOpportunity", "cornerRisk", "endgame"];

export function canShowCoachHint({
  isCpuThinking = false,
  players,
  session,
  settings,
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

  return getSessionLegalMoves(session).length > 0;
}

export function createCoachHintModel(
  context: CoachHintVisibilityContext,
): CoachHintModel | null {
  if (!canShowCoachHint(context)) {
    return null;
  }

  const hint = createCoachHint(
    context.session.board,
    context.session.currentDisc,
  );

  if (hint === null || !isHintAllowedByMode(hint, context.settings.mode)) {
    return null;
  }

  return {
    hint,
    mode: context.settings.mode,
  };
}

function isHintAllowedByMode(
  hint: CoachHint,
  mode: CoachHintMode,
): mode is Exclude<CoachHintMode, "off"> {
  if (mode === "off") {
    return false;
  }

  if (mode === "active") {
    return true;
  }

  return gentleHintKinds.includes(hint.kind);
}

function isOnePlayerGame(players: PlayerSettings): boolean {
  return (
    (players.black.type === "human" && players.white.type === "cpu") ||
    (players.white.type === "human" && players.black.type === "cpu")
  );
}
