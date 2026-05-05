import type { AnalyzeMoveCandidatesOptions } from "./analyzeMoveCandidates";
import type { SquareIndex } from "../game/othello";
import type { CandidateMoveReview, MoveReviewReason } from "./reviewTypes";

export type CoachHintKind =
  | "cornerOpportunity"
  | "cornerRisk"
  | "mobilityRisk"
  | "mobility"
  | "endgame"
  | "candidate";

export type CoachHintSeverity = "low" | "medium" | "high";

export type CoachHint = {
  candidate: CandidateMoveReview | null;
  kind: CoachHintKind;
  message: string;
  reasons: MoveReviewReason[];
  severity: CoachHintSeverity;
  square: SquareIndex | null;
};

export type CoachHintDraft = {
  candidate: CandidateMoveReview;
  kind: CoachHintKind;
  severity: CoachHintSeverity;
};

export type CoachHintMessageStyle = "vague" | "specific";

export type CreateCoachHintOptions = Partial<AnalyzeMoveCandidatesOptions> & {
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
  riskHintLimit?: number;
};

export type CreateCoachHintsFromAnalysisOptions = {
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
  riskHintLimit?: number;
};
