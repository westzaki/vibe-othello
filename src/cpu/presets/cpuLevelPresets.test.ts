import { describe, expect, it } from "vitest";
import { cpuLevels } from "../cpuLevels";
import {
  cpuLevelPresets,
  getCpuLevelPreset,
  type CpuLevelPreset,
} from "./cpuLevelPresets";

describe("CPU level presets", () => {
  it("defines one preset for every user-facing CPU level", () => {
    expect(cpuLevels).not.toContain("level7");

    for (const level of cpuLevels) {
      expect(cpuLevelPresets[level].level).toBe(level);
    }
  });

  it("defines the teacher-only level outside the user-facing levels", () => {
    expect(cpuLevelPresets.level7.level).toBe("level7");
  });

  it("returns the preset for a CPU level", () => {
    const preset: CpuLevelPreset = getCpuLevelPreset("level4");

    expect(preset.level).toBe("level4");
    expect(preset.chooseMove).toBe(cpuLevelPresets.level4.chooseMove);
  });
});
