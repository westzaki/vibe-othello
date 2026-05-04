import { describe, expect, it } from "vitest";
import { normalizeAppSettings } from "./useAppSettings";

describe("normalizeAppSettings", () => {
  it("keeps stored boolean settings", () => {
    expect(
      normalizeAppSettings({
        coachHintMode: "active",
        soundEnabled: false,
        undoEnabled: false,
      }),
    ).toEqual({
      coachHintMode: "active",
      soundEnabled: false,
      undoEnabled: false,
    });
  });

  it("falls back per setting when stored values are invalid", () => {
    expect(
      normalizeAppSettings({
        coachHintMode: "loud",
        soundEnabled: "false",
        undoEnabled: false,
      }),
    ).toEqual({
      coachHintMode: "gentle",
      soundEnabled: true,
      undoEnabled: false,
    });
  });

  it("falls back to defaults for non-object stored values", () => {
    expect(normalizeAppSettings(null)).toEqual({
      coachHintMode: "gentle",
      soundEnabled: true,
      undoEnabled: true,
    });
    expect(normalizeAppSettings(["soundEnabled"])).toEqual({
      coachHintMode: "gentle",
      soundEnabled: true,
      undoEnabled: true,
    });
  });
});
