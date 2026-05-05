import { useState } from "react";
import { cpuLevels, type CpuLevel } from "../../cpu";
import type { GameMode, HumanDisc } from "../../game/matchSetup";

type StartMatchSetupPanelProps = {
  initialCpuLevel: CpuLevel;
  initialHumanDisc: HumanDisc;
  initialMode: GameMode;
  onOpenSettings: () => void;
  onStart: (mode: GameMode, cpuLevel: CpuLevel, humanDisc: HumanDisc) => void;
};

export function StartMatchSetupPanel({
  initialCpuLevel,
  initialHumanDisc,
  initialMode,
  onOpenSettings,
  onStart,
}: StartMatchSetupPanelProps) {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [cpuLevel, setCpuLevel] = useState<CpuLevel>(initialCpuLevel);
  const [humanDisc, setHumanDisc] = useState<HumanDisc>(initialHumanDisc);
  const cpuLevelIndex = Math.max(0, cpuLevels.indexOf(cpuLevel));
  const isOnePlayer = mode === "onePlayer";

  return (
    <div className="start-panel" aria-label="Match setup">
      <ModeSelector mode={mode} onModeChange={setMode} />

      <div className="start-panel__match-options">
        <CpuLevelSelector
          cpuLevelIndex={cpuLevelIndex}
          isOnePlayer={isOnePlayer}
          onCpuLevelChange={setCpuLevel}
        />

        <DiscSelector humanDisc={humanDisc} onHumanDiscChange={setHumanDisc} />
      </div>

      <div className="start-panel__action">
        <button
          className="game-action game-action--primary start-panel__start"
          onClick={() => onStart(mode, cpuLevel, humanDisc)}
          type="button"
        >
          <span className="start-panel__start-icon" aria-hidden="true">
            ▶
          </span>
          ゲーム開始
        </button>
        <button
          className="start-panel__settings"
          onClick={onOpenSettings}
          type="button"
        >
          <span aria-hidden="true">⚙</span>
          設定
        </button>
      </div>
    </div>
  );
}

type ModeSelectorProps = {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
};

function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="start-panel__section start-panel__section--mode">
      <h2 className="start-panel__title">
        <span className="start-panel__icon" aria-hidden="true">
          ▦
        </span>
        対戦モード
      </h2>
      <div className="mode-selector">
        <button
          aria-pressed={mode === "onePlayer"}
          className={getModeButtonClass(mode === "onePlayer")}
          onClick={() => onModeChange("onePlayer")}
          type="button"
        >
          <span aria-hidden="true">{mode === "onePlayer" ? "✓" : ""}</span>
          ひとりであそぶ
        </button>
        <button
          aria-pressed={mode === "twoPlayer"}
          className={getModeButtonClass(mode === "twoPlayer")}
          onClick={() => onModeChange("twoPlayer")}
          type="button"
        >
          <span aria-hidden="true">{mode === "twoPlayer" ? "✓" : ""}</span>
          ふたりであそぶ
        </button>
      </div>
    </div>
  );
}

type CpuLevelSelectorProps = {
  cpuLevelIndex: number;
  isOnePlayer: boolean;
  onCpuLevelChange: (level: CpuLevel) => void;
};

function CpuLevelSelector({
  cpuLevelIndex,
  isOnePlayer,
  onCpuLevelChange,
}: CpuLevelSelectorProps) {
  return (
    <div
      className={[
        "start-panel__section",
        "start-panel__section--difficulty",
        !isOnePlayer ? "start-panel__section--inactive" : "",
      ].join(" ")}
    >
      <div className="start-panel__section-header">
        <h2 className="start-panel__title">
          <span className="start-panel__icon" aria-hidden="true">
            ★
          </span>
          CPUの強さ
        </h2>
        {!isOnePlayer && (
          <p className="start-panel__helper">
            ふたりであそぶ時は使いません
          </p>
        )}
      </div>
      <div className="cpu-star-selector" aria-label="CPUの強さ">
        {cpuLevels.map((level, index) => (
          <button
            aria-label={`CPUの強さ ${index + 1}`}
            aria-pressed={cpuLevelIndex === index}
            className={[
              "cpu-star-selector__button",
              index <= cpuLevelIndex
                ? "cpu-star-selector__button--filled"
                : "",
            ].join(" ")}
            disabled={!isOnePlayer}
            key={level}
            onClick={() => onCpuLevelChange(level)}
            type="button"
          >
            {index <= cpuLevelIndex ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );
}

type DiscSelectorProps = {
  humanDisc: HumanDisc;
  onHumanDiscChange: (disc: HumanDisc) => void;
};

function DiscSelector({ humanDisc, onHumanDiscChange }: DiscSelectorProps) {
  return (
    <div className="start-panel__section start-panel__section--disc">
      <h2 className="start-panel__title">
        <span className="start-panel__icon" aria-hidden="true">
          ●
        </span>
        あなたの色
      </h2>
      <div className="disc-selector">
        <button
          aria-pressed={humanDisc === "black"}
          className={getDiscButtonClass("black", humanDisc)}
          onClick={() => onHumanDiscChange("black")}
          type="button"
        >
          <span className="disc-selector__disc disc-selector__disc--black" />
          黒
        </button>
        <button
          aria-pressed={humanDisc === "white"}
          className={getDiscButtonClass("white", humanDisc)}
          onClick={() => onHumanDiscChange("white")}
          type="button"
        >
          <span className="disc-selector__disc disc-selector__disc--white" />
          白
        </button>
      </div>
    </div>
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
