// Public API for the CPU package.
// Code outside src/cpu should import from this file so CPU internals can move
// without forcing UI, hooks, or teacher code to chase private module paths.
export { calculateAdvantage } from "./evaluation/advantage";
export type { Advantage } from "./evaluation/advantage";
export { chooseCpuMove } from "./cpu";
export { cpuLevelLabels, cpuLevels } from "./cpuLevels";
export type { CpuLevel, PlayableCpuLevel } from "./cpuLevels";
export { getCpuLevelPreset } from "./presets/cpuLevelPresets";
export type { CpuLevelPreset } from "./presets/cpuLevelPresets";
export { getMobilityDifference } from "./evaluation/evaluationFeatures";
export { getMinimaxMoveScores } from "./search/minimaxSearch";
export { getTeacherMoveScores } from "./strategies/teacherStrategy";
export type { TeacherMoveScore } from "./strategies/teacherStrategy";
export type {
  MinimaxMoveScore,
  MinimaxSearchOptions,
} from "./search/minimaxSearch";
export { strategicEvaluateBoard } from "./evaluation/strategicEvaluateBoard";
