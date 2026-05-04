import { useEffect, useState } from "react";
import type { Advantage } from "../cpu";
import type { PlayerSettings } from "../game/players";
import type { GameSession } from "../game/session";
import {
  createCoachHintModel,
  type CoachHintModel,
  type CoachHintSettings,
} from "../teacher";

const coachHintPollMs = 250;
const helpfulCoachHintVisibleMs = 5200;
const riskCoachHintVisibleMs = 3200;

type UsePlayCoachHintModelParams = {
  advantage: Advantage;
  enabled: boolean;
  isCpuThinking: boolean;
  players: PlayerSettings;
  session: GameSession;
  settings: CoachHintSettings;
};

export function usePlayCoachHintModel({
  advantage,
  enabled,
  isCpuThinking,
  players,
  session,
  settings,
}: UsePlayCoachHintModelParams): CoachHintModel | null {
  const hintKey = createHintKey({
    enabled,
    isCpuThinking,
    session,
    settings,
  });
  const [modelState, setModelState] = useState<{
    key: string;
    model: CoachHintModel;
  } | null>(null);

  useEffect(() => {
    if (
      !enabled ||
      isCpuThinking ||
      settings.mode === "off" ||
      session.status !== "playing"
    ) {
      return;
    }

    const startedAt = getCurrentTimeMs();
    let hideTimeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      const nextModel = createCoachHintModel({
        advantage,
        isCpuThinking,
        players,
        session,
        settings,
        thinkingTimeMs: getCurrentTimeMs() - startedAt,
      });

      if (nextModel === null) {
        return;
      }

      setModelState({
        key: hintKey,
        model: nextModel,
      });
      hideTimeoutId = window.setTimeout(
        () => {
          setModelState((currentModelState) =>
            currentModelState?.key === hintKey ? null : currentModelState,
          );
        },
        getCoachHintVisibleMs(nextModel),
      );
      window.clearInterval(intervalId);
    }, coachHintPollMs);

    return () => {
      window.clearInterval(intervalId);
      if (hideTimeoutId !== null) {
        window.clearTimeout(hideTimeoutId);
      }
    };
  }, [
    advantage,
    enabled,
    hintKey,
    isCpuThinking,
    players,
    session,
    settings,
  ]);

  return modelState?.key === hintKey ? modelState.model : null;
}

function getCurrentTimeMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function getCoachHintVisibleMs(model: CoachHintModel): number {
  return model.hint.kind === "cornerRisk"
    ? riskCoachHintVisibleMs
    : helpfulCoachHintVisibleMs;
}

function createHintKey({
  enabled,
  isCpuThinking,
  session,
  settings,
}: {
  enabled: boolean;
  isCpuThinking: boolean;
  session: GameSession;
  settings: CoachHintSettings;
}): string {
  return [
    enabled ? "enabled" : "disabled",
    settings.mode,
    isCpuThinking ? "cpu-thinking" : "ready",
    session.status,
    session.currentDisc,
    session.moveHistory.length,
    session.lastMove ?? "none",
    session.board.join(","),
  ].join("|");
}
