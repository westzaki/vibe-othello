import type { CoachHintModel } from "../../teacher";
import { isRiskCoachHint } from "./coachHintMarkers";

type CoachHintPanelProps = {
  model: CoachHintModel | null;
};

export function CoachHintPanel({ model }: CoachHintPanelProps) {
  if (model === null) {
    return <div className="coach-hint coach-hint--empty" aria-hidden="true" />;
  }

  return (
    <div
      className={[
        "coach-hint",
        `coach-hint--${model.mode}`,
        model.hints.some(isRiskCoachHint)
          ? "coach-hint--has-risk"
          : "coach-hint--helpful",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      {model.hints.map((hint) => {
        const isRiskHint = isRiskCoachHint(hint);

        return (
          <div
            className={[
              "coach-hint__item",
              isRiskHint
                ? "coach-hint__item--risk"
                : "coach-hint__item--helpful",
            ].join(" ")}
            key={`${hint.kind}-${hint.square ?? "none"}`}
          >
            <span className="coach-hint__label">
              {isRiskHint ? "気をつけて" : "見てみよう"}
            </span>
            <p>{hint.message}</p>
          </div>
        );
      })}
    </div>
  );
}
