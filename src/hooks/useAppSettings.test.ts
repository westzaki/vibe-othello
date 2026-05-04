import { describe, expect, it } from "vitest";
import { normalizeAppSettings } from "./useAppSettings";

describe("normalizeAppSettings", () => {
  it("keeps stored boolean settings", () => {
    expect(
      normalizeAppSettings({
        soundEnabled: false,
        undoEnabled: false,
      }),
    ).toEqual({
      soundEnabled: false,
      undoEnabled: false,
    });
  });

  it("falls back per setting when stored values are invalid", () => {
    expect(
      normalizeAppSettings({
        soundEnabled: "false",
        undoEnabled: false,
      }),
    ).toEqual({
      soundEnabled: true,
      undoEnabled: false,
    });
  });

  it("falls back to defaults for non-object stored values", () => {
    expect(normalizeAppSettings(null)).toEqual({
      soundEnabled: true,
      undoEnabled: true,
    });
    expect(normalizeAppSettings(["soundEnabled"])).toEqual({
      soundEnabled: true,
      undoEnabled: true,
    });
  });
});
