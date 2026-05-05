import type { Board, DiscColor } from "../game/othello";
import {
  analyzeMoveCandidates,
  type MoveCandidateAnalysis,
} from "./analyzeMoveCandidates";
import { createCoachHintFromDraft } from "./coachHintMessages";
import { selectCoachHintDrafts } from "./coachHintPolicy";
import type {
  CoachHint,
  CreateCoachHintOptions,
  CreateCoachHintsFromAnalysisOptions,
} from "./coachHintTypes";

export type {
  CoachHint,
  CoachHintKind,
  CoachHintMessageStyle,
  CoachHintSeverity,
  CreateCoachHintOptions,
  CreateCoachHintsFromAnalysisOptions,
} from "./coachHintTypes";

const defaultCoachHintSearchDepth = 3;

export function createCoachHint(
  board: Board,
  disc: DiscColor,
  options: CreateCoachHintOptions = {},
): CoachHint | null {
  return createCoachHints(board, disc, options)[0] ?? null;
}

export function createCoachHints(
  board: Board,
  disc: DiscColor,
  {
    includeCandidateFallback = false,
    messageStyle = "specific",
    riskHintLimit,
    searchDepth = defaultCoachHintSearchDepth,
  }: CreateCoachHintOptions = {},
): CoachHint[] {
  const analysis = analyzeMoveCandidates(board, disc, { searchDepth });

  return createCoachHintsFromAnalysis(analysis, {
    includeCandidateFallback,
    messageStyle,
    riskHintLimit,
  });
}

export function createCoachHintsFromAnalysis(
  analysis: MoveCandidateAnalysis,
  {
    includeCandidateFallback = false,
    messageStyle = "specific",
    riskHintLimit,
  }: CreateCoachHintsFromAnalysisOptions = {},
): CoachHint[] {
  return selectCoachHintDrafts(analysis, {
    includeCandidateFallback,
    riskHintLimit,
  }).map((draft) => createCoachHintFromDraft(draft, messageStyle));
}
