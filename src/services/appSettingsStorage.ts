import type { CoachHintMode } from "../teacher";

const appSettingsStorageKey = "vibe-othello-settings";

export type AppSettings = {
  advantageBarEnabled: boolean;
  coachHintMode: CoachHintMode;
  soundEnabled: boolean;
  undoEnabled: boolean;
};

export const defaultAppSettings: AppSettings = {
  advantageBarEnabled: true,
  coachHintMode: "gentle",
  soundEnabled: true,
  undoEnabled: true,
};

export function readStoredAppSettings(): AppSettings {
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

export function writeStoredAppSettings(settings: AppSettings): void {
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

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return defaultAppSettings;
  }

  return {
    advantageBarEnabled:
      typeof value.advantageBarEnabled === "boolean"
        ? value.advantageBarEnabled
        : defaultAppSettings.advantageBarEnabled,
    coachHintMode: isCoachHintMode(value.coachHintMode)
      ? value.coachHintMode
      : defaultAppSettings.coachHintMode,
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

function isCoachHintMode(value: unknown): value is CoachHintMode {
  return value === "off" || value === "gentle" || value === "active";
}
