import { describe, expect, it } from "vitest";
import { cpuLevels } from "../cpuLevels";
import {
  cpuLevelPresets,
  getCpuLevelPreset,
  type CpuLevelPreset,
} from "./cpuLevelPresets";

describe("CPU level presets", () => {
  it("defines one preset for every user-facing CPU level", () => {
    expect(Object.keys(cpuLevelPresets)).toEqual([...cpuLevels]);
  });

  it("returns the preset for a CPU level", () => {
    const preset: CpuLevelPreset = getCpuLevelPreset("level4");

    expect(preset.level).toBe("level4");
    expect(preset.chooseMove).toBe(cpuLevelPresets.level4.chooseMove);
  });
});
