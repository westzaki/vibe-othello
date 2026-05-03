import { useState } from "react";
import type { GameMode, HumanDisc } from "../game/matchSetup";
import { cpuLevelLabels, cpuLevels, type CpuLevel } from "../game/players";

type StartScreenProps = {
  initialCpuLevel: CpuLevel;
  initialHumanDisc: HumanDisc;
  initialMode: GameMode;
  onStart: (mode: GameMode, cpuLevel: CpuLevel, humanDisc: HumanDisc) => void;
};

export function StartScreen({
  initialCpuLevel,
  initialHumanDisc,
  initialMode,
  onStart,
}: StartScreenProps) {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [cpuLevel, setCpuLevel] = useState<CpuLevel>(initialCpuLevel);
  const [humanDisc, setHumanDisc] = useState<HumanDisc>(initialHumanDisc);

  return (
    <section className="start-screen" aria-labelledby="start-title">
      <div className="start-screen__header">
        <p className="eyebrow">Othello Arena</p>
        <h1 id="start-title">Vibe Othello</h1>
      </div>

      <div className="start-screen__board-preview" aria-hidden="true">
        <span className="start-screen__disc start-screen__disc--black" />
        <span className="start-screen__disc start-screen__disc--white" />
        <span className="start-screen__disc start-screen__disc--white" />
        <span className="start-screen__disc start-screen__disc--black" />
      </div>

      <div className="start-panel" aria-label="Match setup">
        <div className="start-panel__section">
          <h2 className="start-panel__title">Mode</h2>
          <div className="mode-selector">
            <button
              aria-pressed={mode === "onePlayer"}
              className={getModeButtonClass(mode === "onePlayer")}
              onClick={() => setMode("onePlayer")}
              type="button"
            >
              1P
            </button>
            <button
              aria-pressed={mode === "twoPlayer"}
              className={getModeButtonClass(mode === "twoPlayer")}
              onClick={() => setMode("twoPlayer")}
              type="button"
            >
              2P
            </button>
          </div>
        </div>

        {mode === "onePlayer" && (
          <>
            <div className="start-panel__section">
              <h2 className="start-panel__title">Your Disc</h2>
              <div className="disc-selector">
                <button
                  aria-pressed={humanDisc === "black"}
                  className={getDiscButtonClass("black", humanDisc)}
                  onClick={() => setHumanDisc("black")}
                  type="button"
                >
                  <span className="disc-selector__disc disc-selector__disc--black" />
                  Black
                </button>
                <button
                  aria-pressed={humanDisc === "white"}
                  className={getDiscButtonClass("white", humanDisc)}
                  onClick={() => setHumanDisc("white")}
                  type="button"
                >
                  <span className="disc-selector__disc disc-selector__disc--white" />
                  White
                </button>
              </div>
            </div>

            <div className="start-panel__section">
              <h2 className="start-panel__title">CPU Level</h2>
              <div className="cpu-level-grid">
                {cpuLevels.map((level, index) => (
                  <button
                    aria-label={`CPU level ${index + 1}, ${cpuLevelLabels[level]}`}
                    aria-pressed={cpuLevel === level}
                    className={[
                      "cpu-level-button",
                      cpuLevel === level ? "cpu-level-button--selected" : "",
                    ].join(" ")}
                    key={level}
                    onClick={() => setCpuLevel(level)}
                    type="button"
                  >
                    <span className="cpu-level-button__number">
                      {index + 1}
                    </span>
                    <span className="cpu-level-button__label">
                      {cpuLevelLabels[level]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button
          className="game-action game-action--primary start-panel__start"
          onClick={() => onStart(mode, cpuLevel, humanDisc)}
          type="button"
        >
          Start Match
        </button>
      </div>
    </section>
  );
}

function getDiscButtonClass(disc: HumanDisc, humanDisc: HumanDisc): string {
  return [
    "disc-selector__button",
    humanDisc === disc ? "disc-selector__button--selected" : "",
  ].join(" ");
}

function getModeButtonClass(isSelected: boolean): string {
  return [
    "mode-selector__button",
    isSelected ? "mode-selector__button--selected" : "",
  ].join(" ");
}
