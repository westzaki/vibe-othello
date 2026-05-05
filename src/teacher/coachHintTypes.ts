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

export type CoachHint = {
  candidate: CandidateMoveReview | null;
  kind: CoachHintKind;
  message: string;
  reasons: MoveReviewReason[];
  square: SquareIndex | null;
};

export type CoachHintDraft = {
  candidate: CandidateMoveReview;
  kind: CoachHintKind;
};

export type CoachHintMessageStyle = "vague" | "specific";

export type CreateCoachHintOptions = Partial<AnalyzeMoveCandidatesOptions> & {
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
};

export type CreateCoachHintsFromAnalysisOptions = {
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
};
