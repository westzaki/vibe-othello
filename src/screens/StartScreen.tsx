import { useState } from "react";
import { cpuLevels, type CpuLevel } from "../cpu";
import type { GameMode, HumanDisc } from "../game/matchSetup";

type StartScreenProps = {
  initialCpuLevel: CpuLevel;
  initialHumanDisc: HumanDisc;
  initialMode: GameMode;
  onOpenSettings: () => void;
  onStart: (mode: GameMode, cpuLevel: CpuLevel, humanDisc: HumanDisc) => void;
};

export function StartScreen({
  initialCpuLevel,
  initialHumanDisc,
  initialMode,
  onOpenSettings,
  onStart,
}: StartScreenProps) {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [cpuLevel, setCpuLevel] = useState<CpuLevel>(initialCpuLevel);
  const [humanDisc, setHumanDisc] = useState<HumanDisc>(initialHumanDisc);
  const cpuLevelIndex = Math.max(0, cpuLevels.indexOf(cpuLevel));
  const isOnePlayer = mode === "onePlayer";

  return (
    <section className="start-screen" aria-labelledby="start-title">
      <div className="start-menu">
        <div className="start-screen__hero">
          <div className="start-screen__header">
            <p className="start-screen__eyebrow">やさしく学べるオセロ</p>
            <h1 id="start-title">Vibe オセロ</h1>
            <p className="start-screen__lead">
              相手にいい手をあげない一手を、あそびながら見つけよう
            </p>
          </div>

          <div className="start-screen__board-preview" aria-hidden="true">
            <span className="start-screen__disc start-screen__disc--black" />
            <span className="start-screen__disc start-screen__disc--white" />
            <span className="start-screen__disc start-screen__disc--white" />
            <span className="start-screen__disc start-screen__disc--black" />
          </div>
        </div>

        <div className="start-panel" aria-label="Match setup">
          <div className="start-panel__header">
            <p className="start-panel__eyebrow">対局の準備</p>
            <p className="start-panel__lead">
              あそびかたと色をえらんだら、すぐにはじめられます
            </p>
          </div>

          <div className="start-panel__section start-panel__section--mode">
            <h2 className="start-panel__title">
              <span className="start-panel__step">1</span>
              対戦モード
            </h2>
            <div className="mode-selector">
              <button
                aria-pressed={mode === "onePlayer"}
                className={getModeButtonClass(mode === "onePlayer")}
                onClick={() => setMode("onePlayer")}
                type="button"
              >
                <span aria-hidden="true">
                  {mode === "onePlayer" ? "✓" : ""}
                </span>
                ひとりであそぶ
              </button>
              <button
                aria-pressed={mode === "twoPlayer"}
                className={getModeButtonClass(mode === "twoPlayer")}
                onClick={() => setMode("twoPlayer")}
                type="button"
              >
                <span aria-hidden="true">
                  {mode === "twoPlayer" ? "✓" : ""}
                </span>
                ふたりであそぶ
              </button>
            </div>
          </div>

          <div className="start-panel__match-options">
            <div
              className={[
                "start-panel__section",
                "start-panel__section--difficulty",
                !isOnePlayer ? "start-panel__section--inactive" : "",
              ].join(" ")}
            >
              <div className="start-panel__section-header">
                <h2 className="start-panel__title">
                  <span className="start-panel__step">2</span>
                  CPUの強さ
                </h2>
                <p className="start-panel__helper">
                  {isOnePlayer
                    ? "星が多いほど強くなります"
                    : "ふたりであそぶ時は使いません"}
                </p>
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
                    onClick={() => setCpuLevel(level)}
                    type="button"
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="start-panel__section start-panel__section--disc">
              <h2 className="start-panel__title">
                <span className="start-panel__step">3</span>
                あなたの色
              </h2>
              <div className="disc-selector">
                <button
                  aria-pressed={humanDisc === "black"}
                  className={getDiscButtonClass("black", humanDisc)}
                  onClick={() => setHumanDisc("black")}
                  type="button"
                >
                  <span className="disc-selector__disc disc-selector__disc--black" />
                  黒
                </button>
                <button
                  aria-pressed={humanDisc === "white"}
                  className={getDiscButtonClass("white", humanDisc)}
                  onClick={() => setHumanDisc("white")}
                  type="button"
                >
                  <span className="disc-selector__disc disc-selector__disc--white" />
                  白
                </button>
              </div>
            </div>
          </div>

          <div className="start-panel__action">
            <button
              className="game-action game-action--primary start-panel__start"
              onClick={() => onStart(mode, cpuLevel, humanDisc)}
              type="button"
            >
              <span className="start-panel__start-step">4</span>
              スタート
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
