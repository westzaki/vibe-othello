import type { GameSession } from "../game/session";
import "./debug.css";
import {
  createDebugSession,
  debugFixtures,
  type DebugFixtureName,
} from "./debugFixtures";

type DebugPanelProps = {
  onReplaceSession: (session: GameSession) => void;
};

export function DebugPanel({ onReplaceSession }: DebugPanelProps) {
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
    </aside>
  );
}
