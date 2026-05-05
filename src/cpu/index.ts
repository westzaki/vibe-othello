// Public API for the CPU package.
// Code outside src/cpu should import from this file so CPU internals can move
// without forcing UI, hooks, or teacher code to chase private module paths.
export { calculateAdvantage } from "./evaluation/advantage";
export type { Advantage } from "./evaluation/advantage";
export { chooseCpuMove } from "./cpu";
export {
  cpuLevelDefinitions,
  cpuLevelLabels,
  cpuLevels,
  getCpuLevelDefinition,
  usesCpuMoveWorker,
} from "./cpuLevels";
export type { CpuLevel, CpuLevelDefinition, CpuLevelRuntime } from "./cpuLevels";
export { getCpuLevelPreset } from "./presets/cpuLevelPresets";
export type { CpuLevelPreset } from "./presets/cpuLevelPresets";
export {
  countEmptySquares,
  getMobilityDifference,
} from "./evaluation/evaluationFeatures";
export { choosePerfectEndgameMove } from "./strategies/grandmasterStrategy";
export {
  chooseExactEndgameMove,
  getExactEndgameMoveScores,
  solveExactEndgameDiscDifference,
} from "./search/exactEndgame";
export type {
  ExactEndgameMoveOptions,
  ExactEndgameMoveOrderer,
  ExactEndgameMoveScore,
} from "./search/exactEndgame";
export { getMinimaxMoveScores } from "./search/minimaxSearch";
export type {
  MinimaxMoveScore,
  MinimaxSearchOptions,
} from "./search/minimaxSearch";
export { strategicEvaluateBoard } from "./evaluation/strategicEvaluateBoard";
