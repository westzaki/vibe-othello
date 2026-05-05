import { useEffect, useState } from "react";
import type { CoachHintMode } from "../teacher";
import {
  readStoredAppSettings,
  writeStoredAppSettings,
  type AppSettings,
} from "../services/appSettingsStorage";

export type { AppSettings } from "../services/appSettingsStorage";

export function useAppSettings() {
  const [settings, setSettings] =
    useState<AppSettings>(readStoredAppSettings);

  useEffect(() => {
    writeStoredAppSettings(settings);
  }, [settings]);

  function updateSoundEnabled(soundEnabled: boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled,
    }));
  }

  function updateAdvantageBarEnabled(advantageBarEnabled: boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      advantageBarEnabled,
    }));
  }

  function updateUndoEnabled(undoEnabled: boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      undoEnabled,
    }));
  }

  function updateCoachHintMode(coachHintMode: CoachHintMode) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      coachHintMode,
    }));
  }

  return {
    settings,
    updateAdvantageBarEnabled,
    updateCoachHintMode,
    updateSoundEnabled,
    updateUndoEnabled,
  };
}
