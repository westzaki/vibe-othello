import { useEffect, useState } from "react";

const appSettingsStorageKey = "vibe-othello-settings";

export type AppSettings = {
  soundEnabled: boolean;
  undoEnabled: boolean;
};

const defaultAppSettings: AppSettings = {
  soundEnabled: true,
  undoEnabled: true,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(readStoredSettings);

  useEffect(() => {
    writeStoredSettings(settings);
  }, [settings]);

  function updateSoundEnabled(soundEnabled: boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled,
    }));
  }

  function updateUndoEnabled(undoEnabled: boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      undoEnabled,
    }));
  }

  return {
    settings,
    updateSoundEnabled,
    updateUndoEnabled,
  };
}

function readStoredSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultAppSettings;
  }

  try {
    const storedSettings = window.localStorage.getItem(appSettingsStorageKey);

    if (storedSettings === null) {
      return defaultAppSettings;
    }

    return normalizeAppSettings(JSON.parse(storedSettings));
  } catch {
    return defaultAppSettings;
  }
}

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return defaultAppSettings;
  }

  return {
    soundEnabled:
      typeof value.soundEnabled === "boolean"
        ? value.soundEnabled
        : defaultAppSettings.soundEnabled,
    undoEnabled:
      typeof value.undoEnabled === "boolean"
        ? value.undoEnabled
        : defaultAppSettings.undoEnabled,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function writeStoredSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      appSettingsStorageKey,
      JSON.stringify(settings),
    );
  } catch {
    // Keep settings usable even when storage is unavailable.
  }
}
