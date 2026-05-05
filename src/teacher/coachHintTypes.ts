import type { AnalyzeMoveCandidatesOptions } from "./analyzeMoveCandidates";
import type { SquareIndex } from "../game/othello";
import type { TeacherGuidanceMoveOptions } from "./teacherGuidanceMove";
import type { CandidateMoveReview, MoveReviewReason } from "./reviewTypes";

export type CoachHintKind =
  | "bestMove"
  | "cornerOpportunity"
  | "cornerRisk"
  | "mobilityRisk"
  | "stableEdge"
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
  includeBestMoveHint?: boolean;
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
  riskHintLimit?: number;
};

export type CreateCoachHintsFromAnalysisOptions = {
  bestMoveSquare?: SquareIndex | null;
  includeBestMoveHint?: boolean;
  includeCandidateFallback?: boolean;
  messageStyle?: CoachHintMessageStyle;
  riskHintLimit?: number;
};

export type TeacherGuidanceOptions = TeacherGuidanceMoveOptions & {
  useTeacherGuidanceMove?: boolean;
};
