import { useEffect, useState } from "react";

const appSettingsStorageKey = "vibe-othello-settings";

export type AppSettings = {
  soundEnabled: boolean;
};

const defaultAppSettings: AppSettings = {
  soundEnabled: true,
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

  return {
    settings,
    updateSoundEnabled,
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

    return {
      ...defaultAppSettings,
      ...JSON.parse(storedSettings),
    };
  } catch {
    return defaultAppSettings;
  }
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
