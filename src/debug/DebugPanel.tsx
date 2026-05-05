import type { GameSession } from "../game/session";
import type { CoachHintDebugSnapshot } from "../teacher";
import "./debug.css";
import {
  createDebugSession,
  debugFixtures,
  type DebugFixtureName,
} from "./debugFixtures";

type DebugPanelProps = {
  coachHintDebug?: CoachHintDebugSnapshot | null;
  onReplaceSession: (session: GameSession) => void;
};

export function DebugPanel({ coachHintDebug, onReplaceSession }: DebugPanelProps) {
  if (!import.meta.env.DEV) {
    return null;
  }

  function handleFixtureClick(name: DebugFixtureName) {
    onReplaceSession(createDebugSession(name));
  }

  return (
    <aside className="debug-panel" aria-label="Development debug controls">
      <p className="debug-panel__title">Debug</p>
      <div className="debug-panel__actions">
        {debugFixtures.map((fixture) => (
          <button
            className="debug-panel__button"
            key={fixture.name}
            onClick={() => handleFixtureClick(fixture.name)}
            type="button"
          >
            {fixture.label}
          </button>
        ))}
      </div>
      {coachHintDebug !== undefined && coachHintDebug !== null && (
        <section
          className="debug-panel__section"
          aria-label="Coach hint diagnostics"
        >
          <p className="debug-panel__subtitle">Coach Hint</p>
          <dl className="debug-panel__metrics">
            <div>
              <dt>reason</dt>
              <dd>{coachHintDebug.reason}</dd>
            </div>
            <div>
              <dt>message</dt>
              <dd>{coachHintDebug.message}</dd>
            </div>
            <div>
              <dt>analysis</dt>
              <dd>{coachHintDebug.analysisStatus}</dd>
            </div>
            <div>
              <dt>request</dt>
              <dd>{coachHintDebug.isAnalysisRequested ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt>legal</dt>
              <dd>{coachHintDebug.legalMoveCount}</dd>
            </div>
            <div>
              <dt>best</dt>
              <dd>{coachHintDebug.canShowBestMoveHint ? "yes" : "no"}</dd>
            </div>
            <div className="debug-panel__metric-wide">
              <dt>visible</dt>
              <dd>{formatHintKinds(coachHintDebug.visibleHintKinds)}</dd>
            </div>
            <div className="debug-panel__metric-wide">
              <dt>analysis hints</dt>
              <dd>
                {coachHintDebug.analysisHintCount} /{" "}
                {formatHintKinds(coachHintDebug.hintKinds)}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </aside>
  );
}

function formatHintKinds(hintKinds: string[]): string {
  return hintKinds.length === 0 ? "-" : hintKinds.join(", ");
}
