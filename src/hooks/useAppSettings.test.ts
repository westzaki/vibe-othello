import { describe, expect, it } from "vitest";
import { normalizeAppSettings } from "./useAppSettings";

describe("normalizeAppSettings", () => {
  it("keeps stored boolean settings", () => {
    expect(
      normalizeAppSettings({
        advantageBarEnabled: false,
        coachHintMode: "active",
        soundEnabled: false,
        undoEnabled: false,
      }),
    ).toEqual({
      advantageBarEnabled: false,
      coachHintMode: "active",
      soundEnabled: false,
      undoEnabled: false,
    });
  });

  it("falls back per setting when stored values are invalid", () => {
    expect(
      normalizeAppSettings({
        advantageBarEnabled: "false",
        coachHintMode: "loud",
        soundEnabled: "false",
        undoEnabled: false,
      }),
    ).toEqual({
      advantageBarEnabled: true,
      coachHintMode: "gentle",
      soundEnabled: true,
      undoEnabled: false,
    });
  });

  it("falls back to defaults for non-object stored values", () => {
    expect(normalizeAppSettings(null)).toEqual({
      advantageBarEnabled: true,
      coachHintMode: "gentle",
      soundEnabled: true,
      undoEnabled: true,
    });
    expect(normalizeAppSettings(["soundEnabled"])).toEqual({
      advantageBarEnabled: true,
      coachHintMode: "gentle",
      soundEnabled: true,
      undoEnabled: true,
    });
  });
});
