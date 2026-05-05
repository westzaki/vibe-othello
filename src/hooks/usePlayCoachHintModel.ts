import { useEffect, useRef, useState } from "react";
import type { PlayerSettings } from "../game/players";
import type { GameSession } from "../game/session";
import {
  createCoachHintModel,
  type CoachHint,
  type CoachHintModel,
  type CoachHintSettings,
} from "../teacher";

const coachHintPollMs = 250;

type UsePlayCoachHintModelParams = {
  enabled: boolean;
  isCpuThinking: boolean;
  players: PlayerSettings;
  session: GameSession;
  settings: CoachHintSettings;
};

export function usePlayCoachHintModel({
  enabled,
  isCpuThinking,
  players,
  session,
  settings,
}: UsePlayCoachHintModelParams): CoachHintModel | null {
  const shownRiskHintKeysRef = useRef(new Set<string>());
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
      session.status !== "playing" ||
      session.moveHistory.length === 0
    ) {
      shownRiskHintKeysRef.current.clear();
    }
  }, [enabled, session.moveHistory.length, session.status]);

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
    const intervalId = window.setInterval(() => {
      const nextModel = createCoachHintModel({
        isCpuThinking,
        players,
        session,
        settings,
        thinkingTimeMs: getCurrentTimeMs() - startedAt,
      });

      if (nextModel === null) {
        return;
      }

      const visibleHints = nextModel.hints.filter((hint) => {
        const riskHintKey = createRiskHintKey(hint);

        return (
          riskHintKey === null ||
          !shownRiskHintKeysRef.current.has(riskHintKey)
        );
      });

      if (visibleHints.length === 0) {
        window.clearInterval(intervalId);
        return;
      }

      for (const hint of visibleHints) {
        const riskHintKey = createRiskHintKey(hint);

        if (riskHintKey !== null) {
          shownRiskHintKeysRef.current.add(riskHintKey);
        }
      }

      setModelState({
        key: hintKey,
        model: {
          ...nextModel,
          hint: visibleHints[0],
          hints: visibleHints,
        },
      });
      window.clearInterval(intervalId);
    }, coachHintPollMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
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

function createRiskHintKey(hint: CoachHint): string | null {
  if (hint.kind !== "cornerRisk" || hint.square === null) {
    return null;
  }

  return `${hint.kind}:${hint.square}`;
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
