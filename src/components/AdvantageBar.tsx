import type { CSSProperties } from "react";
import type { Advantage } from "../cpu";

type AdvantageBarProps = {
  advantage: Advantage;
};

export function AdvantageBar({ advantage }: AdvantageBarProps) {
  const barStyle = {
    "--black-advantage": `${advantage.blackPercent}%`,
  } as CSSProperties;

  return (
    <section
      className="advantage-panel"
      aria-label={`形勢: 黒 ${advantage.blackPercent} パーセント, 白 ${advantage.whitePercent} パーセント`}
    >
      <div className="advantage-panel__header">
        <span>形勢</span>
        <strong>{getAdvantageLabel(advantage)}</strong>
      </div>
      <div className="advantage-bar" style={barStyle} aria-hidden="true">
        <span className="advantage-bar__segment advantage-bar__segment--black" />
        <span className="advantage-bar__segment advantage-bar__segment--white" />
      </div>
      <div className="advantage-panel__scores">
        <span className="advantage-panel__score advantage-panel__score--black">
          黒 {advantage.blackPercent}%
        </span>
        <span className="advantage-panel__score advantage-panel__score--white">
          白 {advantage.whitePercent}%
        </span>
      </div>
    </section>
  );
}

function getAdvantageLabel(advantage: Advantage): string {
  if (advantage.leadingDisc === null) {
    return "互角";
  }

  return `${formatDisc(advantage.leadingDisc)}が有利`;
}

function formatDisc(disc: "black" | "white"): string {
  return disc === "black" ? "黒" : "白";
}
