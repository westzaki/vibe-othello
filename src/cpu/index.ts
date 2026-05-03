// Public API for the CPU package.
// Code outside src/cpu should import from this file so CPU internals can move
// without forcing UI, hooks, or teacher code to chase private module paths.
export { calculateAdvantage } from "./advantage";
export type { Advantage } from "./advantage";
export { chooseCpuMove } from "./cpu";
export { getMobilityDifference } from "./evaluationFeatures";
export { getMinimaxMoveScores } from "./minimaxSearch";
export type { MinimaxMoveScore, MinimaxSearchOptions } from "./minimaxSearch";
export { strategicEvaluateBoard } from "./strategicEvaluateBoard";
