import { describe, expect, it } from "vitest";
import { cpuLevelDefinitions, cpuLevels } from "../cpuLevels";
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
    expect(preset.label).toBe(cpuLevelDefinitions.level4.label);
    expect(preset.runtime).toBe(cpuLevelDefinitions.level4.runtime);
  });
});
