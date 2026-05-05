import type {
  BoardHintMarker,
  BoardHintSeverity,
  BoardHintTone,
} from "../../components/Board";
import type { CoachHintModel } from "../../teacher";

export function createCoachHintMarkers(
  model: CoachHintModel | null,
): BoardHintMarker[] {
  if (model === null) {
    return [];
  }

  return model.hints.flatMap((hint) => {
    if (hint.square === null) {
      return [];
    }

    return [
      {
        severity: getCoachHintSeverity(hint),
        square: hint.square,
        tone: getCoachHintTone(hint),
      },
    ];
  });
}

export function isRiskCoachHint(hint: CoachHintModel["hint"]): boolean {
  return hint.kind === "cornerRisk" || hint.kind === "mobilityRisk";
}

function getCoachHintTone(hint: CoachHintModel["hint"]): BoardHintTone {
  return isRiskCoachHint(hint) ? "risk" : "helpful";
}

function getCoachHintSeverity(
  hint: CoachHintModel["hint"],
): BoardHintSeverity | undefined {
  if (isRiskCoachHint(hint)) {
    return hint.severity;
  }

  return hint.kind === "bestMove" ? "high" : "medium";
}
