import { describe, expect, it } from "vitest";
import type { CoachHint, CoachHintModel } from "../../teacher";
import { createCoachHintMarkers } from "./coachHintMarkers";

describe("coach hint markers", () => {
  it("carries risk severity to board markers", () => {
    const highRiskHint = createHint({
      kind: "cornerRisk",
      severity: "high",
      square: 9,
    });
    const helpfulHint = createHint({
      kind: "cornerOpportunity",
      severity: "medium",
      square: 0,
    });
    const model: CoachHintModel = {
      analysis: {} as CoachHintModel["analysis"],
      hint: highRiskHint,
      hints: [highRiskHint, helpfulHint],
      mode: "active",
    };

    expect(createCoachHintMarkers(model)).toEqual([
      {
        severity: "high",
        square: 9,
        tone: "risk",
      },
      {
        severity: undefined,
        square: 0,
        tone: "helpful",
      },
    ]);
  });
});

function createHint({
  kind,
  severity,
  square,
}: Pick<CoachHint, "kind" | "severity" | "square">): CoachHint {
  return {
    candidate: null,
    kind,
    message: "",
    reasons: [],
    severity,
    square,
  };
}
