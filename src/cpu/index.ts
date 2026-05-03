// Public API for the CPU package.
// Code outside src/cpu should import from this file so CPU internals can move
// without forcing UI, hooks, or teacher code to chase private module paths.
export { calculateAdvantage } from "./evaluation/advantage";
export type { Advantage } from "./evaluation/advantage";
export { chooseCpuMove } from "./cpu";
export { getMobilityDifference } from "./evaluation/evaluationFeatures";
export { getMinimaxMoveScores } from "./search/minimaxSearch";
export type {
  MinimaxMoveScore,
  MinimaxSearchOptions,
} from "./search/minimaxSearch";
export { strategicEvaluateBoard } from "./evaluation/strategicEvaluateBoard";
